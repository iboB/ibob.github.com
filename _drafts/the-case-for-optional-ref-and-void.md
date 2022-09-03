---
layout: post
title: The Case for `std::optional<X&>` and `std::optional<void>`
category: programming
tags: ['c++']

excerpt: Well, at least according to me
---

C++17 introduced `std::optional` in the standard library. It's a pretty useful addition and many people were using custom implementations of it for many years before it finally became part of the standard. Many of those custom implementations, like, say [Boost.Optional](https://www.boost.org/doc/libs/1_80_0/libs/optional/doc/html/index.html), have a specialization of optional for references: `optional<T&>`. Some of them even had a specializaton for `void`. `std::optional` does not allow any of those. I think it should.

This issue has been raised many times. Opponents of these specializations say that `std::optional<void>` would be equivalent to `bool` and `std::optional<X&>` would be equivalent to a raw pointer, `X*`, and it would be redundant to have them, since the exact same functionality is already available. I agree that these equivalences are correct. I also say that it makes absolutely no sense to actually type `std::optional<void>` or `std::optional<X&>`. If you find yourself needing those, you can indeed safely and correctly just use `bool` or `X*`.

Using it this in template code, however, is not that pleasant.

Suppose you have a functional object which is nullable, like `std::function`. You want to create a function which safely calls the object. What would be the return type of such safe proxy?

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

And, finally, if *know* that they return a regular value, we can safe use `std::optional`

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
auto safe_call(F& f, Args&&... args) -> std::optional<decltype(f(std::forward<Args>(args)...))> {
    if (!f) return std::nullopt;
    if constexpr (std::is_same_v<void, decltype(m_func(std::forward<Args>(args)...))>) {
        m_func(std::forward<Args>(args)...);
        std::optional<void> ret;
        ret.emplace();
        return ret;
    }
    else {
        return m_func(std::forward<Args>(args)...);
    }
}
```

This is much shorter and, for the most part, more readable, but sadly the fact that `void` is a second class citizen in C++, make it still a bit clunky. I'm definitely a fan `void` becoming a first class type in C++. There has been debate about this idea in the past, but lately it has not been in the focus of any proposals or activities that I'm aware of. In a perfect world, where optional did have specializations for refs and `void`, it would be possible have this gem:

```c++
template <typename F, typename... Args>
auto safe_call(F& f, Args&&... args) -> std::optional<decltype(f(std::forward<Args>(args)...))> {
    if (!f) return std::nullopt;
    return m_func(std::forward<Args>(args)...);
}
```

the problem is that optional is falsy by default. We could make use of emplace, but this would make the code kind clunky.
