---
layout: post
title: Don't Use unique_ptr for PIMPL
category: programming
tags: ['c++']

excerpt: ... because unique_ptr in libc++ breaks value semantics
---

So, there I was. Minding my own business, writing code, when suddenly... `std::unique_ptr` from libc++.

I have a task manager class. It has some tasks and in its destructor it executes all not-yet-executed tasks like this:

```c++
task_manager::~task_manager()
{
    while (!tasks.empty())
    {
        auto to_execute = std::move(tasks);
        for (auto& t : to_execte)
        {
            t.execute(*this);
        }
    }
}
```

This `while` loop is needed because the execution of some tasks can spawn other tasks. The destructor executes tasks until there are any (risking an endless loop, yes).

Here's a task which can spawn other tasks:

```c++
void worker::execute(task_manager& tm)
{
    do_work();
    tm.push_task(notify_user("work done"));
}
```

This is, of course, an oversimplification and there are threads and synchronization involved, but it's enough for my point.

With time, `task_manager` became bloated. This added an unnecessary burden on compiling tasks as they all need to include `task_manager.hpp` so they can spawn other tasks. So, I decided that it's time to make `task_manager` a PIMPL class:

```c++
// task_manager.hpp
class task_manager
{
    // ...
private:
    class impl;
    std::unique_ptr<impl> m_impl;
};
```

```c++
// task_manager.cpp
task_manager()
    : m_impl(std::make_unique<impl>(*this))
{}

task_manager::~task_manager() = default;
// ...
task_manager::impl::~impl()
{
    while (!tasks.empty())
    {
        auto to_execute = std::move(tasks);
        for (auto& t : to_execte)
        {
            // can't use *this here as tasks know what a task manager is and not what
            // task_manager::impl is
            t.execute(m_task_manager);
        }
    }
}
```

Did you spot the problem?

The macOS builds started crashing. It all worked fine with msvc and gcc, and clang with libstdc++, but when libc++ got involved, crashes ensued.

The thing is that the destructor of `std::unique_ptr` in libc++ is written like this:

```c++
~unique_ptr()
{
    reset(); // Ooh! I saved a couple of lines of code
}
```

Whereas in the other standard libraries it's written like this:

```c++
~unique_ptr()
{
    if (m_ptr)
        m_deleter(m_ptr);
}
```

Did you spot the problem now?

The *other* thing is that `reset` is required [by specification](https://en.cppreference.com/w/cpp/memory/unique_ptr/reset) to first assign the newly set pointer to the managed object and then delete the old managed object. So, calling `reset` in the destructor of `unique_ptr` means that first the pointer is invalidated and *only then* the destructor of the managed object is called.

For my code this meant that this sequence of events can happen:

1. The defaulted destrutor of `task_manager` is called, which calls the destrutor of its member `std::unique_ptr<impl>`
1. The unique pointer sets its managed pointer to `nullptr` and calls the deleter of the (now old) managed object
1. The destructor of `task_manager::impl` is called and executes a task
2. This calls `task_manager::push_task` to add another task
3. `task_manager::push_task` redirects via `m_impl->push_task`
4. The actual pointer within the `unique_ptr` is **`nullptr`** thanks to step 2
5. Segmentation fault.

Where's `auto_ptr` when you need it, eh?

So... yeah... libc++ breaks value semantics. A `unique_ptr<T>` member is not functionally equivalent to an `optional<T>` member. But for my PIMPL needs I required it to be.

This all can easily be fixed by ditching the `unique_ptr` and using plain old `new` and `delete` to manage your memory... like a caveman.

What I did, though, is use this [silly half-assed `unique_ptr` implementation that I wrote](https://gist.github.com/iboB/c359d4ff542022543440f2e774e053e2) so I can keep my defaulted destructor. Feel free to use it if you want.

But the moral is: `unique_ptr` is allowed to break value semantics. Don't use it for PIMPL.
