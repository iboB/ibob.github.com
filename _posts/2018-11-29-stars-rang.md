---
layout: post
title: "Stars: rang"
category: stars
tags: ['stars']


excerpt: A Minimal, Header only Modern c++ library for terminal goodies
---

Windows makes it pretty hard to write presentable CLI applications, but some libraries can help.

| Summary | |
|---|---|
| Repo     | **rang** [agauniyal/rang](https://github.com/agauniyal/rang): A Minimal, Header only Modern c++ library for terminal goodies |
| License  | **Public Domain** |
| Language | **C++** |
| Status   | Complete. Supported. Several commits a year. |

## Review

There are some attempts to recreate ncurses for Windows, but the thing is, the default Windows console is just garbage. There exist terminal emulators for Windows which do support more features (for example the PowerShell terminal) and even ncurses entirely, but since there's so many of them, working on a powerful text-UI application for windows, typically involves shipping your own terminal emulator with it instead of trying to support a non-existing standard.

*rang* doesn't try to be ncurses and I like that a lot. It gives you styles and colors in the terminal. It's made for C++ `iostream` objects. It works in Unix terminals and in the Windows console. Using it is really simple. **It-Just-Works&trade;**

If you simply want colors and styles in the terminal, you should definitely give it a try.

{% include stars-post-footer.md %}
