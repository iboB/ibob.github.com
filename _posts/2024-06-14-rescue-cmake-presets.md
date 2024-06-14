---
layout: post
title: Let's Rescue CMake Presets
category: programming
tags: ['c++', 'cmake']

excerpt: ... because at this point I'd call them "almost usable"
---

> Here I complain about CMake presets. I did some (perhaps an hour or so) of research, but it's not impossible that I completely missed something that actually solves my problem. In case I have, I'd be really happy to know what it is.

So [CMake presets](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html) have been around for some time now and at first glance they're pretty nice.

Now, I have some minor complaints about verbosity, the [syntax of conditions](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html#condition), even the choice of JSON as a format ([Hello! Comments?](https://gitlab.kitware.com/cmake/cmake/-/issues/22602)), but really, they're mostly minor stuff and I won't go further into them in this post.

I have a huge problem with the way presets other than **configure** are handled.

So, let's imagine a use case: You have many configure presets, say 20. You want to set up a CI to build and test all of them.

I don't believe this is an uncommon use case. In fact I believe this should be the most common one. And how is one supposed to do this? There are two solutions that I can think of.

* Annoying: Don't create build and test presets. Once you configure, navigate to the binary directory and run `cmake --build . && ctest`
    * And how do you know where the binary directory is?
    * You don't. No way to query preset values.
    * You can parse the output of `cmake --preset mypreset` and look for `-- Build files have been written to: ...`. Ew
    * You can force a change by specifying `-B someBinaryDir` after `--preset` and then use that directory. Then you will have to forget all the fancy reasons for which you specified a binary directory in the preset.
* Terrifying: Create 20 build presets and then 20 test presets for each configure preset which are exactly the same except for the `configurePreset` field.
    * ...and you will have to keep these additional two lists of presets in sync with the list of configure presets.
    * Manually? Double ew! Annoying *and* error prone. The worst of all worlds.
    * Yes, yes, it can be atomated. Perhaps using the `vendor` field to store metadata for you automation code (*since you can't have comments-based metadata in JSON*) or by creative use of includes... The problem of automating this means the proliferation of ad hoc solutions which are not compatible between one another.

And if you want to have fancy build and test presets which actually do something, and you use some IDE or editor which has integration with CMake presets, things get really ugly.

My main point is that there already are tens if not hundreds of scripts, tools, even IDEs like Visual Studio and QtCreator, which predate CMake presets and have their own way of dealing with presets. They have their ways of dealing with this problem. If there is to be a unifying standard way of dealing with presets, it should not require yet more third-party ad hoc tooling to do basic stuff.

So, I have a proposal or two for the CMake developers. In my [previous ranty post about issues with CMake]({% post_url 2020-01-13-cmake-package-management %}) [Craig Scott](https://gitlab.kitware.com/craig.scott) was so kind to take issue with the problem and work on it until finally, after years, [there was a solution](https://x.com/crascit/status/1799562358337212843). So, Craig, please, how about:

## Simple: Implicit Presets

To cover the most basic use-case and probably 99% of the needs out there a simple change can be made to CMake.

I would suggest to parse build and test (and why not package and workflow) presets names and have a way to infer a configure preset from there. If we have a configure preset called `myconfig`, how about something like:

* `cmake --build --preset=myconfig-default`
* or `ctest --preset=cfg/myconfig`
* or why not `cmake --build --configure-preset=myconfig`

...or something in this spirit. Just think of this as having implicit build, test, and package presets for each configure preset. The implicit ones only use the default value for each field. 99% of problems solved.

## Complex: Multi Presets

Allow defining non-configure presets which can match multiple configure presets. Thus not just the default values will be accessible but also custom ones. Something like:

```json
"buildPresets": [
    {
      "multiConfig": true,
      "name": "${configurePreset}-bench-ab",
      "targets": ["benchmark-a", "benchmark-b"],
    }
]
```

This can be combined with a introducing tags in configure presets and then such "`multiConfig`" presets can match them to indicate their applicability.

Anyway, having a way to define umbrella or wildcard presets can be really powerful, but more thought needs to be put into this. I don't pretend to be thorough in the suggestion above. It's just an idea.
