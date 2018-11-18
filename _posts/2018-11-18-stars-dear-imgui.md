---
layout: post
title: "Stars: Dear ImGui"
category: stars
tags: ['stars', 'gui', 'gamedev']

excerpt: Bloat-free Immediate Mode Graphical User interface for C++ with minimal dependencies
---

Another one of my earlier stars is Dear ImGui. Since then it has become a *must* for any engine developer... or, rather, anyone who creates software which has real time graphics... or, rather, anyone who wants fast and easy feature-rich GUI.

| Summary | |
|---|---|
| Repo     | **Dear ImGui** [ocornut/imgui](https://github.com/ocornut/imgui): Bloat-free Immediate Mode Graphical User interface for C++ with minimal dependencies |
| License  | **MIT** |
| Language | **C++** |
| Status   | Very active. Multiple commits a week. |
| Links    | Wiki: [ocornut/imgui/wiki](https://github.com/ocornut/imgui/wiki) |

## Review

So, yeah... not much I can say here. I don't know under what kind of boulder you've been living if you don't know about Dear ImGui or simply ImGui as it's known among its users, since it is *the* immediate-mode GUI library to use.

The initial idea behind the library was to be used in small graphics programming demos, examples, and tutorials, and for small tools for game engines, but it grew to be much more than that. Due to its ease of use, good performance, feature reach interface, and code quality (which is critical for extensibility) it became more and more widespread. Now people are using ImGui for projects which in the past would have used a dedicated huge GUI framework like Qt. There are [many full-featured editors](https://github.com/ocornut/imgui#gallery) created with it. People start using it for software unrelated to graphics rendering, for example the GUI of a live profiler feed. It even appears the main GUI in some games, even though it has very limited capabilities for changing its appearance.

Now, it is true that if the performance is critical for a piece of software, Dear ImGui is probably not the way to go. Retained GUI does have the theoretical capability to have the best performance possible. However, as I said, its performance is pretty decent, and if you don't have time to create you own GUI, I think ImGui is a much safer bet than risking using a retained GUI library which has a worse performance than it. And such do exist.

Moreover, you're not bound by any particular renderer or programming language. Dear ImGui is renderer agnostic, but there are [many integrations](https://github.com/ocornut/imgui/wiki/Bindings#frameworkengine-bindings) and it's pretty easy to write your own. It's written in C++ (03), but there are many [bindings to other languages](https://github.com/ocornut/imgui/wiki/Bindings#language-bindings) and since one those language is pure C, you can easily create any new language integration you like on that.

Dear ImGui is great! It's yuge! Nobody would know that, but it's the best immediate-mode GUI library out there. Start using it!

{% include stars-post-footer.md %}
