---
layout: post
title: The Same Bug in libc++ and libstdc++ Makes Immutable Objects Hard
category: programming
tags: ['c++', 'gcc', 'clang']

excerpt: ...and itroduces potentially subtle slowness in `std::vector::insert`
---


https://gcc.gnu.org/bugzilla/show_bug.cgi?id=98473

https://bugs.llvm.org/show_bug.cgi?id=48619
