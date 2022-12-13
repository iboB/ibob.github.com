---
layout: post
title: Don't Use shared_ptr's Aliasing Constructor
category: programming
tags: ['c++']

excerpt: to be added
---

As Peted Dimov put it "it's not shared_ptr's job to ignore the arguments you give it because they are dangerous". In this case I disagree. I consider this a defect of the standard.

`itlib::make_aliased`
