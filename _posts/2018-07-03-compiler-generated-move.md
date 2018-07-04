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

"Whoa!", I thought, "Why do you want to copy the struct? It's obviously movable, so just use the compiler-generated move constructor."

After a short investigation I found that the culprit was the `std::function` member because, as it turns out, `std::function`'s [move constructor](https://en.cppreference.com/w/cpp/utility/functional/function/function) is not `noexcept`. This is a big problem because `std::vector` uses [`std::move_if_noexcept`](https://en.cppreference.com/w/cpp/utility/move_if_noexcept) on reallocation to move its members only if their move constructors are `noexcept` and otherwise copy them. That's because there is simply not a reasonable way to preserve the valid state of the `vector` if a move throws and exception.

And why isn't `std::function`'s move constructor `noexcept`? Well in hindsight it's obvious. There is no guarantee that the variables captured by value from a lambda will have `noexcept` move constructors. `std::function` must be able to hold any lambda, so for that to be possible it can't have a `noexcept` move constructor of its own.[^1]

Finally, since a member's move constructor isn't `noexcept`, the compiler-generated move constructor of a class or struct is also not `noexcept`. It's only logical.

So, it turns out that before adding the `unique_ptr` member there were vectors of integers (and big ones, mind you) copied on each reallocation of the vector of `simple_struct`. A sad waste of CPU cycles.

Luckily the fix was simple. ~~A `= default` move constructor *is* `noexcept`.~~[^2] I didn't need to copy the struct, so I just deleted the copy constructor. Thus the vector had no choice but to use the move constructor. I did this with full realization that should a move constructor throw, the vector *will* end up in an invalid state. I documented it, but it's highly unlikely for this to ever become an issue. So the final version of `simple_struct`, which wasn't pointlessly copied, ended up like this:

```c++
struct simple_struct
{
    simple_struct() = default;
    simple_struct(simple_struct&&) = default;
    simple_struct(const simple_struct&) = delete;

    std::function<void(int)> func;
    std::vector<int> data; // call func with each element in data
    std::unique_ptr<complex_struct> more_data;
};
```

So, what if you *do* need to copy that struct? In that case, you will sadly have to write your own `noexcept` move constructor and in it manually move all members (like a caveman).

And what if you *do* expect your objects to throw on move? Well... even *sadlier*, in that case, you will have to do something about it. Either don't use `std::vector`, or don't hold your objects by value, or something even smarter that I can't think of. In the case of `std::function` you may have to resort to writing your own equivalent which doesn't have a small buffer optimization and doesn't have to move its contents (or at least not if they aren't `is_nothrow_move_constructible`).

I'm not going to get into the argument on whether all move constructors should be `noexcept`. Always. Noexceptions. *(but I think they should)*

The sad truth is that we, as C++ programmers, in order to do our job must learn several rules... and then learn several thousand exceptions and special cases, so we don't [blow our whole legs off](https://www.goodreads.com/quotes/226222-c-makes-it-easy-to-shoot-yourself-in-the-foot).

I added this to my mental list of gotchas and hopefully this blog post will help others to be more mindful when relying on the compiler-generated move constructor.

___

[^1]: As pointed out by comments on [Cpplang Slack](https://cpplang.slack.com). This isn't that obvious. `std::function` doesn't *have* to move its contents. True most if not all implementation use a small buffer optimization, but they may choose *not* to use it in case its contents don't agree with `is_nothrow_move_constructible`. Alas, they don't seem to choose so.
[^2]: Thanks to [Miro Knejp](https://twitter.com/mknejp) for pointing out this error.
