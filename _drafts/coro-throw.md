---
layout: post
title: "Throwing exceptions from coroutines"
category: programming
tags: ['c++', 'coroutines']

excerpt: ... and why we still can't have nice things
---

It's late 2024. Are corotuines usable yet?

I guess the aswer is: *almost*.

This time I was triggered by handling exceptions from coroutines.

So, you want to throw an exception from a coroutine. The wisdom says that in your `promise_type` you have to implement `unhandled_exception`, store the exception in `std::exception_ptr` and then rethrow it or handle it otherwise when it's appropriate. This is a decent approach in many situations. However for synchronous coroutines (think generators) I'd say it's overcomplicated to the point of being stupid.

In a synchronous coroutine I should be able to implement `unhandled_exception` like so:

```cpp
void unhandled_exception() {
    throw; // beauty
}
```

...and make my exception somebody else's problem. However the standard didn't allow this initially. The coroutine state after such a move was simply not specified. Is it suspended? What does it mean when `final_suspend` is not called? Apparently no one had thought of this trivial use case. Now, the complex ones, sure, but the standard committee is beyond trivialities...

Anyway.

So, someone finaly figured out that it *is* stupid to require the overly complicated code for something as trivial as propagating the exception, made a defect report and it was even [reflected in the standard](https://cplusplus.github.io/CWG/issues/2451.html)... in 2022, but at least it was retroactive, which means that it applies to C++20, even though it came out later. C++20 conforming compilers must implement it. For example it is available in GCC 11.4.

Clang prior to 17 however, doesn't care. Doing this in pre-17 clang will leave the coroutine in a crazy state where its local variables want to be destroyed by both the exit of scope from `throw` *and* by `handle.destroy()`.

OK. So pre-17 clang doesn't work. If you target Apple clang, you can't use the pleasant rethrow. As of this writing Apple clang is at 15, and with the speed of Apple, by the time it reaches 17 we will have colonized Mars.

Back to storing it into `std::exception_ptr` I guess.

However(!), what no one had thought of was what to do when you throw an exception from an eager coroutine. That would be one which does not suspend on `initial_suspend` or at all. Now, the defect report from above seems to cover it well. You can retrhtow in `unhandled_exception` so it should just work, right? Well, as is the norm with C++, it's not so easy. From a pedantic reader's perspective, it is not defined what happens with the coroutine state. Since you thow before the first suspend, it should be the compiler's job to own (and free) the coroutine state, but since there is an exception and the coroutine must be "suspended at its final suspend point" it should be the user code who owns (and must free) the state. As a result no one really owns the state and it's necessarily leaked.

I'm not the first one to notice this. There *is* a [defect report](https://github.com/cplusplus/CWG/issues/575) about this, too, but it's not yet reflected in the standard. This literally means that **according to the standard, rethrowing from an eager corotuine before the first suspend can be e leak, and there's nothing you can do about it**.

Sigh.

Ok, but since you want to target Apple clang (silly you), you accepted that you're storing the exception in a pointer and handling it later, right? Can this be done here, too? Yes it can! If you don't rethrow from `unhandled_exception`, you own the state. You can free it and there will be no leak. But when will you handle it? At the first suspension? What if there is none? But more importantly, this breaks RAII. Let me tell you why.

A class and a coroutine are functionally (well... mostly) equivalent. Sure it's not practical to forget about coroutines and always use classes, but it can technically be done:

```cpp
template <typename T, typename Alloc = std::allocator<T>>
vector_coro vector() {
    T* mybegin = nullptr;
    T* myend = nullptr;
    ...
    while (true) {
        auto method = co_await method_call{};
        if (method.type == vector_coro::methods::size) co_yield myend - mybegin;
        if (method.type == vector_coro::methods::begin) co_yield mybegin;
        ...
    }
}
```

Yes, it's an abomination, but still, possible.

So yeah. They are equivalent. Some of these equivalencies are not as contrived as methods. For example, the code in a corotuine before its first suspend is equivalent to a class's constructor. That's obvious when you think about it.




