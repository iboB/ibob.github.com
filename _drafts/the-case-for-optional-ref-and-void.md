---
layout: post
title: The Case for `std::optional<X&>` and `std::optional<void>`
category: programming
tags: ['c++']

excerpt: Well, at least according to me
---

C++17 introduced `std::optional` in the standard library. It's a pretty useful addition and many people were using custom implementations of it for many years before it finally became part of the standard. Many of those custom implementations, like, say [Boost.Optional](https://www.boost.org/doc/libs/1_80_0/libs/optional/doc/html/index.html), have a specialization of optional for references: `optional<T&>`. Some of them even have a specializaton for `void`. `std::optional` does not allow any of those. I think it should.

This issue has been raised many times. Opponents of these specializations say that `std::optional<void>` would be equivalent to `bool` and `std::optional<X&>` would be equivalent to a raw pointer, `X*`, and it would be redundant to have them, since the exact same functionality is already available, without the need for fancy equivalents. I agree that these equivalences are correct. I also say that it makes absolutely no sense to actually type `std::optional<void>` or `std::optional<X&>`. If you find yourself needing those, you can indeed safely and correctly just use `bool` or `X*`.

Using it this in template code, however, is not that pleasant.

Suppose you have a functional object which is nullable, like `std::function`. You want to create a function which safely calls the object. What would be the return type of such safe proxy? It can be the same as the function's and we can throw an exception if it's not accessible, but that will make the calling code complicated, and will be dangerously close to exceptional flow control if we expect null functions often.

If we *know* that these functions are always void, then it's easy:

```c++
template <typename F, typename... Args>
bool safe_proxy(F& f, Args&&... args) {
    if (!f) return false;
    f(std::forward<Args>(args)...);
    return true;
}
```

If we *know* that they return a reference, then we can do:

```c++
template <typename F, typename... Args>
auto safe_proxy(F& f, Args&&... args) -> std::add_pointer_t<decltype(f(std::forward<Args>(args)...)> {
    if (!f) return nullptr;
    return &f(std::forward<Args>(args)...);
}
```

And, finally, if we *know* that they return a regular value, we can safely use `std::optional`

```c++
template <typename F, typename... Args>
auto safe_proxy(F& f, Args&&... args) -> std::optional<decltype(f(std::forward<Args>(args)...)> {
    if (!f) return std::nullopt;
    return f(std::forward<Args>(args)...);
}
```

Now, we *can* combine these three functions into one. It would go something like this:

```c++
template <typename F, typename... Args>
decltype(auto) safe_proxy(F& f, Args&&... args) {
    using ret_t = decltype(f(std::forward<Args>(args)...));
    auto proxy = [&]() -> ret_t { return f(std::forward<Args>(args)...); };
    if constexpr (std::is_same_v<void, ret_t>) {
        if (!f) return false;
        proxy();
        return true;
    }
    else if constexpr (std::is_reference_v<ret_t>) {
        if (!f) return (std::remove_reference_t<ret_t>*)nullptr;
        return &proxy();
    }
    else {
        // not void, not ref
        using opt = std::optional<ret_t>;
        if (!f) return opt{};
        return opt{proxy()};
    }
}
```

There's a small demo of this [here](https://godbolt.org/z/1c3PqE48a). It's also possible to create a fully C++11 compatible solution here with function traits and some SFINAE, though I'm not going to delve *that* deep here.

This is not a pretty function, but it works. Well, at least as long as we only care about the truthiness of the return value. If we want to propagate the the result into more template code, this has the potential to cause much headache.

Now, imagine we did have an otpional type with specializations for references and `void`. Then we could write something like this:

```c++
template <typename F, typename... Args>
auto safe_proxy(F& f, Args&&... args) -> std::optional<decltype(f(std::forward<Args>(args)...))> {
    if (!f) return std::nullopt;
    if constexpr (std::is_same_v<void, decltype(f(std::forward<Args>(args)...))>) {
        f(std::forward<Args>(args)...);
        std::optional<void> ret;
        ret.emplace();
        return ret;
    }
    else {
        return f(std::forward<Args>(args)...);
    }
}
```

This is much shorter and, for the most part, more readable, but sadly the fact that `void` is a second class citizen in C++, make it still a bit clunky. I'm definitely a fan `void` becoming a first class type in C++. There has been debate about this idea in the past, but lately it has not been in the focus of any proposals or activities that I'm aware of. In a perfect world, where optional did have specializations for refs and `void`, it would be possible have this gem:

```c++
template <typename F, typename... Args>
auto safe_proxy(F& f, Args&&... args) -> std::optional<decltype(f(std::forward<Args>(args)...))> {
    if (!f) return std::nullopt;
    return f(std::forward<Args>(args)...);
}
```

...But that's wrong! The problem is that optional is falsy by default. Even if we had first class `void` and `std::optional<void>`, the code above wouldn't work, as the default constructor of `optional` would be equivalent to the value constructor, both having a `void` argument. It would have to be rewritten with emplace just like the in the dedicated `void` vode from the previous example:

```c++
template <typename F, typename... Args>
auto safe_proxy(F& f, Args&&... args) -> std::optional<decltype(f(std::forward<Args>(args)...))> {
    if (!f) return {};
    std::optional<decltype(f(std::forward<Args>(args)...))> ret;
    ret.emplace(f(std::forward<Args>(args)...));
    return ret;
}
```

Still a bit clunky.

Can we have a an `optional` that is truthy by default? The answer here is "yes". And we will, too. C++23 is about to introduce [`std::expected`](https://en.cppreference.com/w/cpp/header/expected) which is a union type of a value and an error. It is truthy by default. The default constructor constructs a value-initialized object. It has a specialization for a reference value, so that's good, but there are no plans for void specializations. And, thinking about it, `std::expected<void, Error>` makes a lot of sense. Yes, you might say that it is very similar to `std::optional<Error>`, but the truthiness is the opposite. Generic code will have to be specialized for these cases, risking bugs and needlessly overcomplicating stuff.

I, for one, would go full `void` on `expected`. Thus `expected<X, void>` would be almost exactly like `optional<X>`, but with the notable difference that it would be truthy by default. In fact, I have gone full `void` on `expected`. Much like many implementations of `optional` were created before it became a part of the standard, many implementations of `expected` exist today. It doesn't require any modern language features and can be safely implemented with C++11. My implementation can be found [here](https://github.com/iboB/itlib/blob/master/include/itlib/expected.hpp), and it does have specializations for ref and `void` values, and for `void` errors. Finally, we can have an even fancier equivalent to `bool`: `itlib::expected<void, void>`. Yay. And, also, we can do this:

In the magical first-class-`void` world:

```c++
template <typename T> using eoptional = itlib::expected<T, void>; // truthy optional

template <typename F, typename... Args>
auto safe_proxy(F& f, Args&&... args) -> eoptional<decltype(f(std::forward<Args>(args)...))> {
    if (!f) return itlib::unexpected();
    return f(std::forward<Args>(args)...);
}
```

... and in the real world:

```c++
template <typename T> using eoptional = itlib::expected<T, void>; // truthy optional

template <typename F, typename... Args>
auto safe_proxy(F& f, Args&&... args) -> eoptional<decltype(f(std::forward<Args>(args)...))> {
    if (!f) return itlib::unexpected();
    if constexpr (std::is_same_v<void, decltype(f(std::forward<Args>(args)...))>) {
        f(std::forward<Args>(args)...);
        return {};
    }
    else {
        return f(std::forward<Args>(args)...);
    }
}
```

Even the real world function became a bit less clunky. Going full `void` is great!

Note that while we might see a specializaton for `std::optional` for refs, and even for `void`, or even `std::expected<void, void>`, I can safely say that we will not see first class `void` in C++. Not in the next 10 years, at least. Likely never. I still like the idea, though...

![futility](/blog/old-man-yells-at-cloud.jpg)

"I WANT FIRST CLASS VOID!"

## My Use Case

If you're interested, I'll talk about my concrete use case now. It is not exactly this safe proxy, though it is similar.

Unfortunately if you're looking for an example of how generic code will become much simpler with `optional<void>`, this is not it. My use case is absolutely satisfied by the "bool/pointer/optional" solution from above. Still, had I wanted a more descriptive error, I still stand by my words that `std::expected<void, E>` would have made things significantly less contrived. That should be obvious.

My use case is callbacks. The software that I work on has a significant amount of callbacks between threads. When we deal with callbacks, their validity is always the main concern. If one provides a callback to another thread, how do they ensure the objects referenced in the callback will be sill alive and kicking when it's finally called? There are, of course, many solutions to this, each with their pros and cons. Our solution is weak pointers. As a result all of our callbacks at one point looked like this:

```c++
void session::on_calc_something_heavy() {
    worker->initiate_heavy_calc(data, [this, payload=weak_from_this()](result r) {
        auto self = payload.lock();
        if (!self) return; // initiator of job has expired, so they don't need this
        on_heavy_calc_result(std::move(result));
    });
}
```

So the first two lines were getting kind of annoying since they had to be added literally everywhere, and we did experience several annoying crashes, where people simply forgot to add them. So I decided to wrap it this in a class. With it the functionality from above looks like this:

```c++
void session::on_calc_something_heavy() {
    worker->initiate_heavy_calc(data, {weak_from_this(), [this](result r) {
        on_heavy_calc_result(std::move(result));
    }});
}
```

Much better. No risk of problems. `weak_func` accepts a weak pointer and a function and will only call the function if the weak pointer has not expired. My initial implementation had the "bool/pointer/optional" solution, but it annoyed me. I didn't find it clean enough. So, I ended up using `itlib::expected`. You can see the implementation and a small demo [here](https://godbolt.org/z/qzx1bo6dG).
