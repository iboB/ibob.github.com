---
layout: post
title: "C++: The Bad Parts"
category: programming
tags: ['c++']

excerpt: A list of things that irk me quite bad in C++
---

* All local objects in a return or a throw statement are converted to xvalues" (`return x.foo() &&`)
* `mem*` funcs with `nullptr` are UB
* `offsetof` in non-standard layourt is UB
* pointer arithmetic on invalid pointers is UB
* lack of any ABI standardization

