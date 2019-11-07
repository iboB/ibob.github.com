---
layout: post
title: Don't Use unique_ptr for PIMPL
category: programming
tags: ['c++']

excerpt: ... because unique_ptr in libc++ breaks value semantics
---

> Edit: there have been a comments that what I'm doing in the first place is UB. I address this at the bottom of the post.

> Edit 2: At first I suspected that this is an ommision in the standard, but now it seems that it's a bug in libc++. More at the bottom.

> Edit 3: Several commenters [in /r/cpp](https://www.reddit.com/r/cpp/comments/dsuhh7/dont_use_unique_ptr_for_pimpl/) pointed out the best solution to the problem. I added information at the bottom of the post.

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

1. The defaulted destructor of `task_manager` is called, which calls the destructor of its member `std::unique_ptr<impl>`
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

---

> The original article ended here, but it seems I need to add a bit more content:

## This is not UB

...at least not for the reasons most commenters pointed out.

The C++ standard says that the lifetime of an object ends when the destructor is called. So what I'm doing in my code is indeed accessing `task_manager` and subsequently `task_manager::impl` after their destructors have been called. The thing is that calling methods of objects after even their lifetime has ended, and the destructor hasn't finished, is not UB. [Special rules apply](http://eel.is/c++draft/class.cdtor). If it had been UB, there would be no way to call a method in your destructor. There would even be no point in specifying member destructor order.

What was UB before I fixed the problem, however, was accessing `unique_ptr` after it's destructor had started. That's because even though it's not UB to access methods of classes in their destructors, [it **is** UB to access standard library types after their lifetime has ended](http://eel.is/c++draft/library#res.on.objects-2). So by adding my own `unique_ptr` implementation, which has guaranteed behavior, this is not a problem anymore.

## It's still a bug in libc++

At first I thought that it was no bug. I couldn't find any wording to explicitly forbid `~unique_ptr` to call `reset`. But user leni546 in the Cpplang slack, pointed out that [such wording exists](https://eel.is/c++draft/unique.ptr.single.dtor#2). So even though what I did was UB, libc++ **still** wasn't correct to call `reset` in the destructor. `unique_ptr` should have value semantics. I am vindicated... kinda.

## The best solution

Thanks to comments [in /r/cpp](https://www.reddit.com/r/cpp/comments/dsuhh7/dont_use_unique_ptr_for_pimpl/) I now have a solution to the problem which allows me to keep using `std::unique_ptr` even though it breaks value semantics.

I can move the destruction logic back where it was: in the `task_manager` destructor, and have the `impl` destructor empty. Thus the code can look like this:

```c++
task_manager::impl::~impl() = default;
// ...
task_manager::~task_manager()
{
    while (!m_impl->tasks.empty())
    {
        auto to_execute = std::move(m_impl->tasks);
        for (auto& t : to_execte)
        {
            t.execute(*this);
        }
    }
}
```

Thus tasks which spawn tasks will have a safe `unique_ptr<impl>` instance to refer to. `~unique_ptr` won't be called at that point. Then when it does get called, there will be no redirections to the `task_manager`.

Thanks, reddit!
