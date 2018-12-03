---
layout: post
title: "Stars: libui"
category: stars
tags: ['stars', 'gui']


excerpt: Simple and portable (but not inflexible) GUI library in C that uses the native GUI technologies of each platform it supports.
---

Sometimes you just want some native UI without having to depend on a huge framework[^1].

| Summary | |
|---|---|
| Repo     | **libui** [andlabs/libui](https://github.com/andlabs/libui): Simple and portable (but not inflexible) GUI library in C that uses the native GUI technologies of each platform it supports. |
| License  | **MIT** |
| Language | **C, Objective C, C++** |
| Status   | Complete. Active. Several commits a month. |

## Review

Before coming across libui, I actually wondered why such a thing doesn't exist: a simple and small library which allows you to whip-up some native UI and forget about it. A library which is focused on creating GUI and isn't trying to be a million other things[^2]. I don't care about extending the library[^3]. Typically all I want are some buttons, some edit boxes, perhaps a list box and that's it.

Well, as it turns out, such a library does exist. It's libui: my star of the day for today. Even't though it's nowhere near as powerful as Qt, or wxWidgets, it has a bunch of useful features but most of all it's much, much easier to build, integrate, and use. It's written in C for Unix systems, C++ for windows, and Objective C for mac OS, but it has a simple C interface, so it's trivial to create a binding for your language of choice, and many bindings already do exist.

Now, as I said, my requirements are typically modest,  but ever since I first saw libui, I haven't written any code for Qt, so, there's that.

Definitely worth checking out!

{% include stars-post-footer.md %}

[^1]: Yes, I'm talking about Qt.
[^2]: Qt, again.
[^3]: OK. Let's say I mean wxWidgets this time.