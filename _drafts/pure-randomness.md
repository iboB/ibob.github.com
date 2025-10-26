---
layout: post
title: "Pure Randomness"
category: programming
tags: ['c++', 'rants']

excerpt: ...as opposed to the dirty randomness `<random>` has to offer
---

A long time ago in a galaxy far, far away C++11 introduced `<random>` to replace the ancient `rand/srand` utilities we had inherited from C via `<stdlib.h>`. "Replace" is an understatement here, as `rand/srand` had already been recognized as mostly useless back in the day. `<random>`, on the other hand, is useful... or rather, as many (most?) things in C++, *almost* useful.

I'll try to summarize the the most common issues that I and many others have had with it.

## Different random engine implementations used to produce different random values

This is now a thing of the past, but for years after the release, standard libaries couldn't agree on how to implement the random engines. As a result as late as 2017 `minstd_rand` was the only engine which consistently produced the same results on all standard library implementations. This was rather unpleasant and rendered the standard library unusable in multi-platform scenarios where predictability for a seed was a requirement.

Luckily, with time this got fixed and now the popular standard libraries use compatible implementations for the engines[^1]. Yay.

## Different distribution implementations produce different random values

This, sadly, is a thing of the present. Distributions are simply not compatible between standard library implementations and here's why:

Suppose you want to produce integers in the range \[1;10\] using an engine which produces uinofrm 32-bit numbers. The naive approach here is widely acceptable: `1 + rng() % 10`. It has a problem though. The range of `rng()` is \[0;4294967295\]. This modulo 10 has a tiny, almost imperceptable bias towards 0-5. Remember: `4294967297` is not a possible result of `rng()` so in modulo 10 world there are 429496730 ways to get 1, but only 429496729 ways to get 7.

What can we do?

For most real-world scenarios this bias is acceptable. But definitely not all. For security, crypto, and heavily regulated industries like gambling, even this tiny bias can be prohibitive.

The most common way to deal with this is rejection sampling: if `rng()` returns a number in the range 4294967290-4294967295, we reject it and "roll" again. But because of this we would "pump" our random engine unevenly. Sampling our distribution, would have a small chance of calling `rng()` two times (and an increasingly smaller chance of calling it three or more times).

Another popular way of dealing with this using double: multiplying the distribution range as in `size * round(4294967295./double(rng()))`. But while in 32-bit case this is acceptable, as double's 53 bit manitssa can hold all possible 32 bit values, things get harder when we deal with 64 bit numbers. If performance is critical using double division can be prohibitive.

This brings us to uniform real distributions. Remember this `4294967295./double(rng())`? As mentioned above the same trick can't work for a 64-bit rng, as double, can't hold all 64 bit numbers with full precision. So, for our next example let's switch to float. A typical approach for a random float distribution would be something like:

```c++
uint32_t i = rng();
i >>= 10; // discard bits to get to 24 significant ones
float unit = float(i) / 0x1p-24f;
return min + (max-min) * unit
```

The problem here is that we may be wasting 1 bit of entropy. Suppose our interval was -1 and 1. `unit` is in \[0;1\] with all possible mantissa bit combinations. Notably *except the sign bit*. If we scale this into negative space - namely to \[-1;1\], we *are* using the sign bit. About half of the possible values in this range will be unreachable with the code above.

For most if not all distributions there are multiple possible implementations with varying pros and cons and the standard does not specify which should be chosen.

So it's up to standard library authors to decide how and if to deal with common problems in distribution implementations. This brings us to the state illustrated in this [Compiler Explorer demo](https://godbolt.org/z/qv9zbfvEW): MSSTL, libstdc++, and libc++ producing three differents sets of values with the most common distributions.

Now, I don't think it's the standard library's job to handle all possible high-risk scenarios like the ones I mentioned above. If perfect entropy and perfect distributions are critical for your software, by all means, write your own distribution code. Write your own random engine while you're at it. The vast majority of use cases are not this however. Most games and Monte Carlo heuristics are perfectly fine using distributions like a bias of 10<sup>-9</sup> or a waste of 10<sup>-15</sup> entropy. Sadly if they value cross-platform determinism in any way, they can't use the standard library's distribution types.

## It's all templates

This is a trend in the standard library. To my knowledge is the only standard library classes which enforce the use of runtime polymorphism are `streambuf`[^2], `any`, and `memory_resource`. There are others like `shared_ptr`, `function`, and `variant` which may faciliate it, but they themselves are templates. It's no wonder that "STL" as in Standard Template Library, although techincally incorrect, is still widely used to refer to the standard library.

There are many cases where one would prefer runtime over compile time polymorphism. Even if we disregard closed source software as a motivation[^3], compile times are still a big concern in many scenarios. An algorithm which wants to provide a "pluggable" random engine or distribution has to be a template. This could be prohibitevely complex. As a result we have a proliferation of `<random>` (and `<chrono>`'s clocks for that matter) polymorphic wrappers or alternative implementations which serve the use cases of different libraries. I myself have experimented with this in `[iboB/polyrand](https://github.com/iboB/polyrand)` (and [iboB/ftm](https://github.com/iboB/ftm) for that matter).

In any case, I think that it should be the standard library's job to provide a way of of dealing with runtime polymoprhism for `<random>` (and, yes, `<chrono>`) the same way that `pmr` was a good idea.

## It's impure

This is the issue responsible for the title of the blog post. It seems that it's not so common as the others and rarely comes up in disussions of the problems of `<random>`.

A pure function would be one that produces the same result for the same input and does not change any external state. We consider methods to be functions which take an instance of the class as an argument, so we can extend purity to methods as well.

Pure functions are good. They allow optimizations. The compiler can optimize away calls to a pure function if a result for a set of paramters is known. For example in a loop like `for (i=0; i<vec.size(); ++i)` the compiler should see that `size()` is pure and if the loop doesn't change the vector's size, it can cache its result and not perform `end-begin` on every iteration.

Another benefit of pure functions is that they can be safely used concurrently (in multiple threads) without worry that they would lead to race conditions. Extending this to classes, too, an object can safely be shared between threads without locking if all access is done through pure methods.

Unfortunately C++ does not have a way of explicitly marking a function as pure[^4] and hence the need for "thread safety" entries in documentation. The somewhat accepted convention is that a const method is pure, and a non-const one isn't.

`<random>` types are not pure.

This, of course, is expected for engines. They need a state to produce random numbers and that state must change in order for them to produce *different* random numbers[^5].

But distributions... Some distributions might also need, or at least benefit from, a mutable state to work. For example normal distributions often use the Box-Muller transform, which produces a pair of normally distributed values with two engine samples. Since the standard demands one value per call from `std::normal_distribution`, implementations are much more efficient if they cache the second element from the produced pair. Otherwise they would have to discard half of their work.

And that's why all standard distributions are allowed to store a mutable state. All overloads of `operator()` in standard distributions are not const.

You would think that this would make it impossible to use a distribution as a parameter to an algorithm that would use it concurrently, but that's not true. This use case was specifically a considered when designing `<random>`. Distributions have a member type `param_type` which is data only and makes it possible to construct a distribution. To make use of it one would do something like:

```c++
template <typename DistroParams>
void concurrent_function(const DistroParams& params) {
    typename DistroParams::distribution_type dist{params};

    // remember: we can't share this, threads need their seeds and
    std::mt19937 rng(thread_specific);

}
```

The thing is *some* distributions don't need a mutable state. Uniform distributions, Bernouli distribution, and likely others,

___

[^1]: Though I predict we will have a similar problem for a while with the newly introduced [`philox_engine`](https://en.cppreference.com/w/cpp/numeric/random/philox_engine.html)
[^2]: ...and arguably it doesn't do it very well
[^3]: ...and I gladly would
[^4]: GCC and clang provide the extension `__attribute__((pure))`, but notably MSVC has nothing.
[^5]: Except [this one](https://xkcd.com/221/), of course.
