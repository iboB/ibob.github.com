---
layout: post
title: "Stars: Mini3d"
category: stars
tags: ['stars', 'engine']

excerpt: Minimalistic, cross platform, open source 3d game engine framework
---

It turns out this is my first star ever. Mini3d: "a minimalistic, cross platform, open source 3d game engine framework". I'm not sure what the author means by a "game engine framework". Possibly that it's bare-bones and doesn't have some features typical for engines like an editor or a GUI library, so it's like a starting point for an actual engine. Anyway, I consider this an incomplete engine. I would probably call it "the beginnings of a 3d game engine".

This is my first post in the [Project Stars]({{ site.baseurl }}{% post_url 2018-11-15-project-stars %}) series. So I'm going to experiment with the tldr info box:

| Summary | |
|---|---|
| Repo     | **Mini3d** [mini3d/mini3d](https://github.com/mini3d/mini3d): Minimalistic, cross platform, open source 3d game engine framework |
| License  | **MIT** |
| Language | **C++03** |
| Status   | Incomplete. Abandoned. 3 commits since May, 2013. |
| Links    | Website: [mini3d.org](http://www.mini3d.org/), Docs: nope |

## Review

First of all I should say that I've never used Mini3d. All my impressions are based on browsing the source code. I starred it because it seemed like a decent effort on the part of the author. I have a few other game engines starred. I think as a game programmer it's important to at least browse through the code of engines and see what they're like. Maybe you have some ideas, maybe you feel good about yourself that you've done something better... Who knows? It's always nice to see other people's perspective on things, even if it's only through code.

The most interesting part of Mini3d (and likely the reason I starred it) is that it's multi platform and it seems to support the major desktop platforms Windows, Linux, macOS, and the major mobile ones: Android and iOS. If all these platforms are indeed supported, it probably won't be a huge effort to port it to another. Even a more exotic one like the browser.

Mini3d seems abandoned. There have been three relatively recent commits, but they are the only ones made since May of 2013. It's also incomplete. It lacks documentation and some parts of the code are clearly placeholders for something that was never implemented.

Mini3d is written entirely in C++ even though GitHub recognizes it as C for some reason. The standard is pre-C++11.

There is no hint of a build system or a build system generator in the repository. It seems that the author's intention is for users to plug it in their own preferred build systems or IDEs.

Finally here's what this project seems to have:
* Initialization for desktop and mobile platforms. This may be useful for people interested in this.
* A basic and rudimentary value animation system
* A graphics subsystem based on interfaces with virtual functions with D3D11 and OpenGL backends. It's probably the most significant part of the project.
* An exporter for Blender to a custom format.
* A basic linear algebra math library.
* The beginnings of a physics subsystem but nothing complete.
* A simple sound system for .ogg files. This was the last thing modified. Seems worth a more detailed look. Getting multi-platform sound to work can be challenging.

Mini3d is not something worth using as it's abandoned and incomplete, but it may be of value to people who want to learn about engines and multi-platform programming. It's pretty small and manageable and the code is simple and straight-forward.

{% include stars-post-footer.md %}
