---
layout: post
title: "Stars: Android Native EGL example"
category: stars
tags: ['stars', 'android', 'example', 'gamedev']

excerpt: Sample that shows how to combine native rendering with Java UI on Android
---

There are many useful repos out there which are very short examples of something simple.

| Summary | |
|---|---|
| Repo     | **Android Native EGL example** [tsaarni/android-native-egl-example](https://github.com/tsaarni/android-native-egl-example): Sample that shows how to combine native rendering with Java UI on Android |
| License  | **Apache License Version 2.0** |
| Language | **C++**, **Java** |
| Status   | Complete. Stale. No commits since 2015. |

## Review

This is a pretty old example of how to set-up an android App with a Java activity and C++ rendering with OpenGL ES underneath. Even though it's old, it's how things pretty much work with newer versions of Android. It will work with modern Android and OpenGL ES versions and is simple and to-the-point.

It does things right too. Starting a separate thread for the C++ rendering is definitely the way to go. Some apps try to initialize the GL context from Java and send it to C++, then call a C++ function from Java each frame. This might be viable for certain simple use-cases, but if you're writing a game or something with more complex logic in C++, you will definitely want more control in the native code. I would certainly advise the approach taken in this example.

As a whole this is a short and succinct example which does something right.

{% include stars-post-footer.md %}
