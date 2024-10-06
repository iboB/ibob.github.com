---
layout: post
title: "Throwing Exceptions From Coroutines"
category: programming
tags: ['c++', 'coroutines']

excerpt: I want to throw exceptions from coroutines and I'm not taking no for an answer.
---

It's late 2024. Are corotuines usable yet?

I guess the aswer is: *almost*.

This time I was triggered by handling exceptions from coroutines.

So, you want to throw an exception from a coroutine. The wisdom says that in your `promise_type` you have to implement `unhandled_exception`, store the exception in `std::exception_ptr`, and then rethrow it or handle it otherwise when it's appropriate. This is a decent approach in many situations. However for synchronous coroutines (think generators) I'd say it's overcomplicated to the point of being stupid.

In a synchronous coroutine I should be able to implement `unhandled_exception` like so:

```cpp
void unhandled_exception() {
    throw; // beauty
}
```

...and make my exception somebody else's problem. However the standard didn't allow this initially. Not expclicitly at least. The coroutine state after such a move was simply not specified. Is it suspended? What does it mean when `final_suspend` is not called? Apparently no one had thought of this trivial use case. Now, the complex ones, sure, but the standard committee is beyond trivialities...

Anyway.

So, someone finaly figured out that it *is* stupid to require the overly complicated code for something as trivial as propagating the exception, made a defect report, and it was even [reflected in the standard](https://cplusplus.github.io/CWG/issues/2451.html)... in 2022, but at least it was retroactive, which means that it applies to C++20 even though it came out later. C++20 conforming compilers must implement it. For example it is available in GCC 11.4.

Clang prior to 17 however, doesn't care. Doing this in pre-17 clang will leave the coroutine in a crazy state where its local variables want to be destroyed by both the exit of scope from `throw` *and* by `handle.destroy()`.

OK. So pre-17 clang doesn't work. If you target Apple clang, you can't use the pleasant rethrow. As of this writing stable Apple clang is at 16, and with the speed of Apple, by the time it reaches 17 we will have colonized Mars.

Back to storing it into `std::exception_ptr` I guess.

However(!), what no one had thought of was what to do when you throw an exception from an eager coroutine. That would be one which does not suspend on `initial_suspend` or at all. Now, the defect report from above seems to cover it well. You can rethrow in `unhandled_exception` so it should just work, right? Well, as is the norm with C++, it's not so easy. From a pedantic reader's perspective, it is not defined what happens with the coroutine state. Since you throw before the first suspend, it should be the compiler's job to own (and free) the coroutine state, but since there is an exception and the coroutine must be "suspended at its final suspend point", it should be the user code who owns (and must free) the state. As a result no one really owns the state and it may be leaked.

I'm not the first one to notice this. There *is* a [defect report](https://github.com/cplusplus/CWG/issues/575) about this, too, but it's not yet reflected in the standard. This literally means that **according to the standard, rethrowing from an eager corotuine before the first suspend can be a leak and there's nothing you can do about it**.

Sigh.

Ok, but since you want to target Apple clang (silly you), you accepted that you're storing the exception in a pointer and handling it later, right? Can this be done here, too? Yes it can! If you don't rethrow from `unhandled_exception`, you own the state. You can free it and there will be no leak. But when will you handle it? At the first suspension? What if there is none? But more importantly, this breaks RAII. Let me tell you why.

A class and a coroutine are functionally (well... mostly) equivalent. Sure it's not practical to forget about classes and always use coroutines, but it can technically be done:

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

So yeah. They are equivalent. Some of these equivalencies are not as contrived as methods. For example, the code in a corotuine before its first suspend is equivalent to a class's constructor. That's obvious when you think about it. And in C++ the only way to handle an error in a constructor are exceptions.

Some people are exception opponents. According to them exceptions are a bad pattern to do error handling. I, for one, am not one. Certainly there are many examples where exceptions are a bad idea[^1], but I'd argue that in some cases they are actually quite useful. That's mainly errors due to user input... but I really don't want to turn this into an exceptions vs no-exceptions post.

Exceptions opponents have devised many ways of dealing with errors in constructors. They all boil down to this pattern:

```cpp
myobj obj;
obj.complete_initialization(); // ... and handle errors from this call however you see fit
```

For example that's how `std::fstream` works. You open a file and then check if the stream is `bad`. That `complete_initialization` is not necessarily a class method. It could be `get_last_error`, it could be checking an output arg of the constructor. The pattern is that after the constructor completes, you do something else and only then can you have a complete[^2] object. Well this is not RAII. I consider having this intermediate object state error prone and clunky[^3]. If you like it, then sure, the standard allows you to safely write your eager coroutines in the manner you know and love:

```cpp
auto obj = generate_stuff_coro(data);
if (obj.has_eager_errors()) {
    // handle them
}
else {
    // generate away
}
```

I hate this. I want to have the exception thrown from `generate_stuff_coro` exactly the same way I would want the exception thrown from a constructor. The standard doesn't allow this. Not without the threat of a leak, at least.

So what can we do?

* Begrudgingly use the `complete_initialization` pattern? *NEVER!*
* Live with the leaks? They are expected to be small and rare. This is tempting and likely acceptable in many pieces of software, but the problems with deliberate leaks is mainly that tooling (leak detectors and sanitizers) will flood you with this false positive (in practical terms) forever. I don't like it.

So I decided to do something else. Create a non-standard experimental solution which works in practice. That is, write some code: an eager coroutine which can throw before its first suspend, or after, or not throw at all, and tweak it until it works on popular compilers with no crashes or leaks. These tweaks would be pretty evil and work around specific compiler idiosyncrasies, but since the standard can't help me, I guess I have to get creative.

[Here's the repo](https://github.com/iboB/eager-coro-leak) in which I did it.

And how did it go?

First I tested how the simplest approach fares. The one I would expect to work after all standard issues are resolved. Here's my trivial wrapper:

```cpp
struct simple_wrapper {
    struct promise_type {
        int last_yield = no_value;

        simple_wrapper get_return_object() {
            return simple_wrapper{std::coroutine_handle<promise_type>::from_promise(*this)};
        }

        std::suspend_never initial_suspend() noexcept { return {}; } // eager
        std::suspend_always final_suspend() noexcept { return {}; } // preserve the final yield

        std::suspend_always yield_value(int v) noexcept {
            last_yield = v;
            return {};
        }

        void return_void() noexcept {}

        void unhandled_exception() {
            throw; // perfection
        }
    };

    std::coroutine_handle<promise_type> handle = nullptr;

    explicit simple_wrapper(std::coroutine_handle<promise_type> h = nullptr) noexcept : handle(h) {}
    ~simple_wrapper() noexcept {
        if (handle) {
            handle.destroy();
        }
    }

    int get() {
        if (!handle || handle.done()) return -1;
        auto ret = handle.promise().last_yield;
        handle.resume();
        return ret;
    }
};

simple_wrapper generator(int from, int to, int throw_on = -1) {
    for (int i = from; i < to; ++i) {
        if (i == throw_on) {
            throw std::runtime_error(std::to_string(i));
        }
        co_yield i;
    }
}
```

* On MSVC this fails when throwing an eager (pre first suspend) exception because of a double free of the coroutine state buffer.
* On stable GCC versions (11-14) it fails in the exact same way.
    * But! On GCC trunk this works.
* On clang &lt;17 throwing eagerly to my surprise passes, but as mentioned before, because pre-17 clang doesn't cover the first defect report, it crashes when throwing after the first suspend. The local coroutine vars get destroyed two times for some reason[^4].
    * On clang 17 and later (17-19) this passes.

Wow! So, by the sheer benevolence of our compiler-writing overlords, gcc trunk and clang 17-19 actually do something sane about the second defect report. Color me suprized.

Alas the use of clang 17-19 in production is, I suspect, pretty small (mostly Android NDK) and, as for gcc trunk, I guess pretty much zero.

So, the problem is twofold. GCC and MSVC don't want me to destroy the coroutine handle on eager throws, and pre-17 clang doesn't want me to directly rethrow from `unhandled_exception` on non-eager throws. How about if I keep track of my first suspend, and if it hasn't happened yet, I rethrow, otherwise I store the exception (like a caveman):

```cpp
struct workaround_wrapper {
    struct promise_type {
        int last_yield = no_value;

        std::exception_ptr exception;
        bool has_been_suspended = false;
        bool has_exception_before_first_suspend = false;

        workaround_wrapper get_return_object() {
            return workaround_wrapper{std::coroutine_handle<promise_type>::from_promise(*this)};
        }

        std::suspend_never initial_suspend() noexcept { return {}; } // eager
        std::suspend_always final_suspend() noexcept { return {}; } // preserve the final yield

        std::suspend_always yield_value(int v) noexcept {
            has_been_suspended = true;
            last_yield = v;
            return {};
        }

        void return_void() noexcept {}

        void unhandled_exception() {
            // imperfection
            if (has_been_suspended) {
                exception = std::current_exception();
            }
            else {
                has_exception_before_first_suspend = true;
                throw;
            }
        }
    };

    std::coroutine_handle<promise_type> handle = nullptr;

    explicit workaround_wrapper(std::coroutine_handle<promise_type> h = nullptr) noexcept : handle(h) {}
    ~workaround_wrapper() noexcept {
        if (handle && !handle.promise().has_exception_before_first_suspend) {
            handle.destroy();
        }
    }

    int get() {
        if (!handle || handle.done()) return -1;
        auto ret = handle.promise().last_yield;
        handle.resume();
        if (handle.promise().exception) {
            std::rethrow_exception(handle.promise().exception);
        }
        return ret;
    }
};
```

Got it! This passes on MSVC and GCC and pre-17 clang. Yay!

But this is actually surprising. I expected this to fail. Specifically I expected it to pass on GCC and MSVC, but fail on clang. After all, the eager throw passed on clang before, so not destroying the handle on an eager throw here should have caused a leak. No leaks though. Huh? I guess some kind of hidden reference counting is in play here. Free lunch. Who whould have thought?

On GCC trunk, the state buffer leaks as expected.

So... I decided not to accommodate gcc trunk and all three of its users in production. I'll just leave it as is and have that as a problem to future me (screw that guy).

Can this be librarified? Sort of, I guess. The problem is that from a library's perspective it can't possibly be known where the coroutine would be suspended. The library could try to wrap all awaitables, but this will be too much work and it would make the code which uses it very ugly. So I decided to make this semi-manual helper:

```cpp
struct throwing_eager_coro_promise_type_helper {
protected:
    std::exception_ptr m_exception;
    bool m_has_been_suspended = false;
    bool m_has_exception_before_first_suspend = false;
public:
    void unhandled_exception() {
        if (m_has_been_suspended) {
            m_exception = std::current_exception();
        }
        else {
            m_has_exception_before_first_suspend = true;
            throw;
        }
    }

    void on_suspend() noexcept {
        m_has_been_suspended = true;
    }

    void rethrow_if_exception() {
        if (m_exception) {
            std::rethrow_exception(m_exception);
        }
    }

    template <typename PT>
    static void safe_destroy_handle(const std::coroutine_handle<PT>& h) noexcept {
        static_assert(std::is_base_of_v<throwing_eager_coro_promise_type_helper, PT>);
        if (h && !h.promise().m_has_exception_before_first_suspend) {
            h.destroy();
        }
    }
};
```

... to be used like so:

```cpp
struct workaround_wrapper {
    struct promise_type : public throwing_eager_coro_promise_type_helper {
        int last_yield = no_value;

        workaround_wrapper get_return_object() {
            return workaround_wrapper{std::coroutine_handle<promise_type>::from_promise(*this)};
        }

        std::suspend_never initial_suspend() noexcept { return {}; } // eager
        std::suspend_always final_suspend() noexcept { return {}; } // preserve the final yield

        std::suspend_always yield_value(int v) noexcept {
            last_yield = v;
            on_suspend(); // manually mark suspend point
            return {};
        }

        void return_void() noexcept {}
    };

    std::coroutine_handle<promise_type> handle = nullptr;

    explicit workaround_wrapper(std::coroutine_handle<promise_type> h = nullptr) noexcept : handle(h) {}
    ~workaround_wrapper() noexcept {
        // helper destroy
        throwing_eager_coro_promise_type_helper::safe_destroy_handle(handle);
    }

    int get() {
        if (!handle || handle.done()) return -1;
        auto ret = handle.promise().last_yield;
        handle.resume();
        handle.promise().rethrow_if_exception(); // helper
        return ret;
    }
};
```

Oh, and to make sure that I know when GCC 15 comes around (and ruins my day) I also added this:

```cpp
#if defined(__GNUC__)
#   if defined(__clang__)
#       if __clang_major__ > 19
#           error "Clang version > 19 is not tested"
#       endif
#   elif __GNUC__ > 14
#       error "GCC version > 14 is not tested"
#   endif
#endif
```

Hacky? Check. Evil? Check. UB? Check. Works? Yes. Now this is programming in C++!

___

[^1]: And a lot of them are pointed out by exception opponents as if the other side wants to use exceptions there anyway.
[^2]: Complete in the sense of the domain that uses the pattern and not in the sense defined by the C++ standard.
[^3]: Another case where people are forced into this clunkyness is when they need a shared pointer to an object in its own constructor. Only intrusive shared pointers can help here.
[^4]: Clang's notoriety of predantically following the standard and doing weird stuff outside of it is confirmed.
