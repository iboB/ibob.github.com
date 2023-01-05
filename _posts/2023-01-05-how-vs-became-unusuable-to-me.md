---
layout: post
title: How Visual Studio Became Unusable to Me
category: programming
tags: ['c++', 'cmake', 'msvc', 'rants']

excerpt: A rant about how my most common workflow doesn't work anymore
---

One of the few products that still keep me mostly on Windows is Visual Studio. I think I can safely say that for the past 25 years, it has been the best IDE for C++ programming[^1]. I think the modern contenders for this title would be CLion and Visual Studio Code. I don't have much experience with CLion, but I've been reading good things about it. Whenever *I'm* not on Windows, I use VSCode. Previously I used QtCreator. Before that I used Code::Blocks and before that, 3000 years ago, mostly nano or SciTe[^2].

Ever since Visual Studio had CMake support with **Open Folder** I've been using this workflow exclusevly and I have absolutely no desire to go back to manually generated .sln/.vcxproj files. That's mostly because I would have to ditch ninja, but there are many reasons as well. Custom CMake configurations[^3] are much easier to manage like this. The folder view is much better than the project view... anyway, Open Folder is great!

Another thing I use all the time is **Compile Single File** (Ctrl-F7). When writing code I find it superior to a full build in every way. You can quickly check that a source file compiles and fix (often anticipated) compilation errors without having to wait for many other sources to compile in parallel or waiting for the linker and whatnot. The most common use case here is when writing code in a header which is included in several source files. While writing the code I often compile one source file (the fastest one to compile) and deal with compilation errors there. A full build step would trigger the parallel compilation of many other sources and I would first have to wait for the slowest one to finish, and second, have my error output cluttered with the same compilation error in different contexts for every source file. So yeah, compiling individual sources is a second nature to me. I'm sure I even do it more often than *strictly* needed, but it's a negligible overhead compared to the rest of the situations.

So, Most often I use Visual Studio with CMake and the Open Folder workflow. I use the ninja generator. I compile single sources all the time.

That's precisely what got broken in Visual Studio 17.4 a couple of months ago.

It doesn't work anymore except for the simplest of targets. Trying to compile a source file works if the owning binary target is defined in CMake in a trivial manner like `add_executable(name src.cpp)`, but for anything more "complex" than this it doesn't. If a target is added through a macro - nope. If the sources are set at a later point with `target_sources` - nope. What happens in these cases is that a bogus source file target name is issued and I get an error. Visual studio tries to invoke CMake with a source file target like `a/b/foo.cpp.obj`, but the correct target should be something like `a/b/CMakeFiles/b.dir/foo.cpp.obj`.

Here's what I think happened. Now, I don't have internal infomation from the dev team and I don't *know* it for certain, but I'm fairly sure about it:

Before VS 17.4 a CMake project would get reconfigured two times when a CMake source is changed. My guess is that the first configuration is used by Visual Studio to generate hidden vcxproj files, so it could parse the targets and sources for IntelliSense and other IDE-specific stuff (like compiling a single source file). The other configuration would be the one used to actually build the project. In my case the ninja one. Visual Studio can't read ninja or CMake scripts, but it *can* definitely read vcxproj files. That's why it needs the first configuration. This double configure was somewhat annoying but not a terrible pain. If anything it was a motivator to optimize the CMake scripts so that configuring doesn't take an excessive amount of time[^4].

With VS 17.4 it started configuring only once. Great! Right?

How does it get the IDE-specific metadata for the project, then? It seems to me that the developers have added a custom CMake parser to Visual Studio for that. I don't know whether it is a reimplementation of CMake (yikes!) or they're integrating some of CMake's code, but they seem to have bugs. The information for single-source targets is lost unless they are a part of a trivially defined binary target. And hence compiling a single source doesn't work most of the time. Well, at least for my not-so-trivial CMakeLists.

I [posted an issue here](https://developercommunity.visualstudio.com/t/BuildCompile-Ctrl-F7-stopped-working-/10204454). But it I doesn't seem to be getting a lot of action. It seems to me that it would take a lo-o-o-ong time until it's addressed.

And until then...

* On my personal computer I've resorted to using VS Code on Windows as well. It really is quite good for C++ programming, but still vastly inferior to Visual Studio for debugging. The fact that it supports only a single loaded .natvis file is also unpleasant. If I have to do more complex debugging, I launch Visual Studio.
* On my work computer I just haven't upgraded to Visual Studio 17.4. I'll try to stick with 17.3 for as long as possible and when I can't, I'll probably switch to VS Code as well.
* I'll try to find time this month to evaluate CLion. As I said, I've been reading a lot of good stuff about it. Perhaps it will become my next IDE.

So... yeah. Seems kinda prosaic, but this little thing will possibly be the Visual Studio killer for me.

Sad.

___

[^1]: I am certain that this statement will lead to at least a million downvotes, but there it is.
[^2]: ... and many expletives
[^3]: combinations of options and other cache vars
[^4]: This reminds me that I have to work on a long overdue post about optimizing CMake. I'll do it. I promise!
