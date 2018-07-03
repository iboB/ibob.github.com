---
layout: post
title: Be Mindful with Compiler-Generated Move Constructors
category: programming
tags: ['c++']

excerpt: Getting burned by my lack of knowledge of the standard library.
---

So, I wrote a simple struct:

```c++
struct simple_struct
{
    std::function<void(int)> func;
    std::vector<int> data; // call func with each element in data
};
```

... and then had a `vector` of those:

```
std::vector<simple_struct> stuffs;
```

... and I was a happy (and oblivious) camper since everything worked.

*If you spotted the problem by now, well done. For me it was a surprise. Curiously when I told the story to some friends, they were suprised too. Hopefully this blog post helps others who didn't see the following coming.*

After a while I had to add a `unique_ptr` member to that struct... and then I got a compiler error that the copy-constructor of `simple_struct` was implicitly deleted and I can't have a `vector` of those.

"Whoa!", I thought, "Why do you want to copy the struct? It's obviosly movable, so just use the compiler-generated move constructor."

After a short investigation I found that the culprit was the `std::function` member because, as it turns out, `std::function`'s [move constructor](https://en.cppreference.com/w/cpp/utility/functional/function/function) is not `noexcept`. This is a big problem because `std::vector` uses [`std::move_if_noexcept`](https://en.cppreference.com/w/cpp/utility/move_if_noexcept) on reallocation to move its members only if their move constructors are `noexcept` and otherwise copy them. That's because there is simply not a reasonable way to preserve the valid state of the `vector` if a move throws and exception.

And why isn't `std::function`'s move constructor `noexcept`? Well in hindsight it's obvious. There is no guarantee that the variables captured by value from a lambda will have `noexcept` move constructors. `std::function` must be able to hold any lambda, so for that to be possble it can't have a `noexcept` move constructor of its own.

Finally since a member's move constructor isn't `noexcept`, the compiler-generated move constructor of a class or struct is also not `noexcept`. It's only logical.

So, it turns out that before adding the `unique_ptr` member there were vectors of integers (and big ones, mind you) copied on each reallocation of the vector of `simple_struct`. A sad waste of CPU cycles.

Lickily the fix was simple. A `= default` move constructor *is* `noexcept`. So the final version of `simple_struct`, which wasn't pointlessly copied, ended up like this:

```c++
struct simple_struct
{
    simple_struct() = default;
    simple_struct(simple_struct&&) = default;

    // you know... just in case
    simple_struct(const simple_struct&) = delete;

    std::function<void(int)> func;
    std::vector<int> data; // call func with each element in data
    std::unique_ptr<complex_struct> more_data;
};
```

I'm not going to get into the argument on whether all move constructors should be `noexcept`. Always. Noexceptions. *(but I think they should)*

The sad truth is that we, as C++ programmers, in order to do our job must learn several rules... and then learn several thousand exceptions and special cases so we don't [blow our whole legs off](https://www.goodreads.com/quotes/226222-c-makes-it-easy-to-shoot-yourself-in-the-foot).

I added this to my mental list of gotchas and hopefully this blog post will help others to be more mindful when relying on the compiler-generated move constructor.
