---
layout: post
title: CMake and the Future of C++ Package Management
category: programming
tags: ['c++', 'cmake']

excerpt: Well, at least according to me
---

*Well, at least according to me*

I recently encountered a CMake feature which I wasn't aware of. It's [FetchContent](https://cmake.org/cmake/help/latest/module/FetchContent.html). I'm sure this is not news to most people since it was added in CMake 3.14[^1] and that's been around since February of 2019, so two years now, but this feature is a revelation.

It can... no, it should... no, it *must* become the stepping stone for future of C and C++ package managers.

*... after an issue with it is resolved, which I will talk about furhter down in the post*

## So, what is FetchContent?

It's pretty straight forward, actually. By using two CMake functions: `FetchContent_Declare` and `FetchContent_MakeAvailable`[^2] users can declare a named content item which can then be... well... fetched *in configure time*. The key here is, as opposed to `file(DOWNLOAD ...)`, this allows three important things:

* Define the means by which the content is produced (not just source, but also types of sources)
* Have an identifiable name for the content
* Maintain the coherency of the content in a well-defined manner

Here's an example directly from the CMake docs:

```cmake
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        release-1.8.0
)
FetchContent_Declare(
  Catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG        v2.5.0
)

# After the following call, the CMake targets defined by googletest and
# Catch2 will be defined and available to the rest of the build
FetchContent_MakeAvailable(googletest Catch2)
```

Ha! `GIT_REPOSITORY`! See? See? This lets us use CMake for package management.

## But what about My-Favorite-Package-Manager&trade;?

I get it. Conan, vcpkg and the many[^3] others that exist are great, but they are external. Of course I've experimented with the popular C++ package managers, but I've been reluctant to actually start using one for my projects. They may have CMake integrations but they are not triggered by CMake. They try &mdash; and succeed &mdash; to be more than CMake. The thing is that, like it or not, CMake is, or at least getting really close to being, the de-facto standard build system for C++[^4]. CMake is terrible in many ways, but it has proven to be the best we've have[^5].

So what do we get by bundling the package manager with the build system?

[Nix](https://en.wikipedia.org/wiki/Nix_package_manager) (which is awesome) or [Rust's Cargo](https://doc.rust-lang.org/cargo/guide/)

### Packages from source

Oh, this package has `CMakeLists.txt`? You don't need to download a binary when you can just fetch it and `add_subdirectory`... it[^6]. It will inherit everything you need from your project.

### Only the packages we need

Sure, you can define different packages depending on platform, [triplet](https://vcpkg.readthedocs.io/en/latest/users/triplets/), and other configurations from other package managers, but you're using their language. And then you have to either reimplement the same configuration analysis in you CMake files, or use some exports from those package managers, which is not always easy. If your package manager is within CMake, you already, inevitably, have all the tools to configure your build. The information for [the compiler](https://cmake.org/cmake/help/v3.3/variable/CMAKE_LANG_COMPILER.html), the [standard](https://cmake.org/cmake/help/latest/variable/CMAKE_CXX_STANDARD.html), the [target platform](https://cmake.org/cmake/help/latest/variable/CMAKE_SYSTEM_NAME.html), the [architecture](https://cmake.org/cmake/help/latest/variable/CMAKE_SYSTEM_PROCESSOR.html), the [linkage](https://cmake.org/cmake/help/latest/variable/BUILD_SHARED_LIBS.html), and [everything else](https://cmake.org/cmake/help/latest/manual/cmake-toolchains.7.html) is already there.

### Single command configuration

`$ cmake .`

...and everything works, everything is up to date, and everything is there. You are ready to build.

## Can I use FetchContent now?

Sort of.

Of course you can use the raw calls, even though they are not yet a package manager. [Adobe do exactly that](https://github.com/adobe/lagrange/tree/72f9a5447b6803245d43a37a18b76e59c16fbda8/cmake/recipes/external).

And, though the feature has been around for some time, I'm only aware of a single package manager which is built with it: [CPM](https://github.com/TheLartians/CPM.cmake).

Now, CPM is awesome and I've started using it in my personal projects. Everything new I make uses CPM and I've migrated some old stuff, too. However it's not a mature and complete package manager. It can't error on package version inconsistencies (though it can detect them) and it's not built to handle binary packages. Source only. That, however, might be the thing you need. It is enough for most of my needs. I wholeheartedly recommend it for personal and/or small projects.

But!

There is a huge problem. Not with CPM, but with FetchContent itself. FetchContent can't be **the** API package managers are built upon today.

This problem is performance. FetchContent is just too slow to be used for a serious load. It's not an unfixable problem, but as far as I understand the issue, it will most likely have to be reimplemented. Here's a table with me experimentig on different machines containing roughly[^7] how much time it takes to run FetchContent per content item, or package. [Here's the CMakeLists.txt](https://github.com/iboB/cmake-fetch-content-perf/blob/82ee13918550f18bbf22bd3bf38c721a7de9fb80/CMakeLists.txt) I used. Note that these times are not from fetching the packages. They are from a "noop" run. One which identifies that everything is up to date, and does nothing.

| OS | CMake Version | Generator | Machine | ~ ms per item |
| ------ | ------ | ------ | ------ | ------ |
| Ubuntu 20.04 | 3.16.3 | Unix Makefiles | ThreadRipper, SSD | 200 |
| Arch Linux | 3.19.2 | Unix Makefiles | 8 core @ 2.4 GHz, HDD | 800 |
| Windows 10 | 3.19.2 | Visual Studio 2019 | ThreadRipper, SSD | 1200 |
| Windows 10 | 3.19.2 | MinGW Makefiles | ThreadRipper, SSD | 1200 |
| Windows 10 | 3.16.3 | MinGW Makefiles | 6 core @ 3 GHz, SSD | 1500 |

That's at *configure time*, so every time the CMake scripts are touched, it will get executed. As you can see even the best time of roughly 200 ms per item is pretty bad, but the Windows times of over 1 second are abysmal. It's simply prohibitive for a project with hundreds or even tens of dependencies to spend 1 second per dependency only to confirm that it's up to date.

I opened [an issue on CMake's tracker](https://gitlab.kitware.com/cmake/cmake/-/issues/21703)[^8] about that, and hopefully it will get addressed in some way. I even have some ideas of how this can be addressed from the outside, just with CMake user code, but I hope it won't come to this.

I truly believe that this is the future of C++ package management. If the preformance issue is fixed (or worked around), I think in several years C++ package management will be based on FetchContent. Whether CPM will become *the* new de-facto standard or some other not-yet-written software, I can't tell, but this is it! I can feel it!

---

> When originally posted the article ended here.

## Recent Developments

As of Jan 21, 2021[^9]:

The CMake issue from above has gotten a lot of attention and the principal developer of FetchContent &mdash; [Craig Scott](https://gitlab.kitware.com/craig.scott) &mdash; is already making great progress on optimizing the performance. Hopefully very soon new CMake releases will contain significant performance improvements of the feature.

CPM is already ahead of this and as of [version 0.28.0](https://github.com/TheLartians/CPM.cmake/releases/tag/v0.28.0) it entirely skips the internal calls to FetchContent if possible resulting in single-digit milliseconds per package in the common case. That's some great work by [Lars Melchior](https://github.com/TheLartians).

Things are looking up!

___

[^1]: aka CMake Pi (3.14% sure I'm the first one ever making this joke)
[^2]: There are others, but these two are the most important
[^3]: Too many?
[^4]: I know. *Technically* CMake is a "build system generator" and not a "build system", but, really, for most intents and purposes you *can* think of it as a build system.
[^5]: The build system we deserve
[^6]: add_subdirectory is now a verb
[^7]: Precisely profiling CMake is actually pretty hard. [volo-zyko/cmake-profiler-stats](https://github.com/volo-zyko/cmake-profile-stats) helps, but is not ideal.
[^8]: Well... [two issues](https://gitlab.kitware.com/cmake/cmake/-/issues/21698).
[^9]: I just now realized that I have the date wrong in my post. It says 2020, but it's actually 2021. &#x1F633; Sadly I can't just fix it as the date is part of the URL and there are lots of links to the post in the wild. Bummer. That'll teach me to be more careful when posting Jekyll blog posts in January.
