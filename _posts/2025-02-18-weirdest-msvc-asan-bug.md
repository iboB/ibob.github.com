---
layout: post
title: "The Weirdest MSVC Address Sanitizer Bug"
category: programming
tags: ['c++', 'rants']

excerpt: ... and quite likely a compiler bug as well
---

So, using an address sanitizer is in most cases very beneficial. Ever since MSVC got one, I've used it in my build pipeline to, erm... varying success. At first it did have its fair share of issues and was not really applicable in production, but for the past several years, I've actually had little to no problems with it.

Today I got hit by the weirtest one, though.

This is the repro:

```c++
#include <memory>
#include <type_traits>
template <typename stream>
struct io {
    io(stream) : b(false) {}
    alignas(64) bool b;
};
int main() {
    auto pi = std::make_unique<int>(543);
    using iio = io<int>;
    io x(7);
    static_assert(std::is_same_v<decltype(x), iio>);
}
```

Build this with `/fsanitize=address` (and a contemporary standard) and you get a `stack-buffer-overflow`.

The program executes fine, mind you. It's just the address sanitizer that complains here.

Now, address sanitizer bugs do happen, and I've been hit by several with various degrees of annoyance, but this one is especially weird. Let me show you why.

If you remove the heap allocation (the first line in `main`), this produces no errors. If you remove the alignment of the `bool` in `io`, this produces no errors. So far, so good. Heap allocations and exotic alighments are understandable sources of address sanitizer confusion. The crazy thing here is that if you don't use template argument deduction in `io x(7);`, and instead specify the type manually as in `io<int> x(7);`, this produces no errors as well.

This leads me to believe that there is a compiler bug involved as well. There is absolutely no reason for those two lines to produce different code. But indeed they do, as can be seen in [this Compiler Explorer demo](https://godbolt.org/z/hs5e7be56). Note the subtle differences in stack initialization in both cases. I, for one can't see anything wrong in both outputs except that they're subtly different. Someone more knowledgable is welcome to chime in.

I posted a report [here](https://developercommunity.microsoft.com/t/Address-sanitizer-bug-when-deducing-temp/10852062) and a complete demo with repro (and non-repros) can be found [here](https://github.com/iboB/msvc-asan-bug-2).

Weird, huh?
