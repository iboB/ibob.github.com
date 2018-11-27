---
layout: post
title: "Stars: MiniFB"
category: stars
tags: ['stars', 'graphics']

excerpt: A small cross platform library to create a frame buffer that you can draw pixels in
---

Another library which does one thing and does it well.

| Summary | |
|---|---|
| Repo     | **MiniFB** [emoon/minifb](https://github.com/emoon/minifb): a small cross platform library to create a frame buffer that you can draw pixels in |
| License  | **MIT** |
| Language | **C** |
| Status   | Complete. Supported. Several commits a year. |

## Review

MiniFB is a pretty simple library from a user's perspective. It only exports three functions. With it you can create a window on all desktop platforms (well, all that matter) and draw to it by simply filling a buffer. Basically coding it like it's 1989 (Back then people used to just get a pointer to the video memory and simply write each frame to it with `memcpy`. Those were the days!)

Whether you're making a simple ray-tracer or a port of a game from the 80s, this library can save you many hours if not days of boilerplate.

{% include stars-post-footer.md %}
