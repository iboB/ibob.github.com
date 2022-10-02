---
layout: post
title: Testing for Expected Build Failure with CMake
category: programming
tags: ['cmake']

excerpt: Well, at least according to me
---

Sometimes you want to test for comilatione errors. A well designed API will try to prevent incorrect usage and implicit dangers with compilation errors as much as possible. Ideally one would have tests to guarantee that certain things just don't compile.

I assume that we agree it doesn't count as a test to trigger the required compilation error once or twice while developing the sofware to make sure that it appears as expected and then leave it at that. I might agree that certain behavior does not need tests, but the whole point of having tests is to prevent regressions.

I think it's hard to formalize which expected compilation errors should be tested. I think it's obvious that if you have an API like `void foo(int)`, it's pointless to have a test that calling `foo("haha")` will not compile. I also think that it's obvious that if you're creating a physical unit library, you do need a test a length value can't be assigned to a weight one. But this post is not about a when we need this. For now, let's also agree that testing that certain things don't compile is sometimes desired. Perhaps sometime we need to test for expected linker errors as well. Why not?

To generalize: *sometimes we need tests for expected build errors as part of a test suite*

How do we do that?



