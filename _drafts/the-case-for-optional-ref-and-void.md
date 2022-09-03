---
layout: post
title: The Case for `std::optional<X&>` and `std::optional<void>`
category: programming
tags: ['c++']

excerpt: Well, at least according to me
---

The Case for `std::optional<void>` and `std::optional<X&>`

Opponents of these specializations say that `std::optional<void>` is equivalent to `bool` and `std::optional<X&>` is equivalent to `X*` and would be redundant to have them. They are right with the first part and and it makes absolutely no sense to actually type `std::optional<void>` and `std::optional<X&>`.

the problem is that optional is falsy by default. We could make use of emplace, but this would make the code kind clunky.
