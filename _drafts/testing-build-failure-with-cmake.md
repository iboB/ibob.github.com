---
layout: post
title: Testing for Expected Build Failure with CMake
category: programming
tags: ['c++', 'cmake']

excerpt: We sometimes need tests for expected build errors as part of a test suite. How do we do that?
---

> If you're not interested in the article and just want a librarified solution for CMake, go to

Sometimes you want to test for comilation errors. A well designed API will try to prevent incorrect usage and implicit dangers with compilation errors as much as possible. Ideally one would have tests to guarantee that certain things just don't compile.

I think it's hard to formalize which expected compilation errors should be tested. To me it's obvious that if you have an API like `void foo(int)`, it's pointless to have a test that calling `foo("haha")` will not compile. To me it's also obvious that if you're creating a physical unit library, you do need a test that a length value can't be assigned to a weight one. But this post is not about a when we need such tests. For now, let's agree that testing that certain things don't compile is sometimes desired.

I also assume here that we agree that it doesn't count as a test to trigger the required compilation error a couple of times while developing the sofware to make sure that it appears as expected and then leave it at that. As mentioned above, I agree that some behavior doesn't need tests, but the whole point of having tests is to prevent regressions.

And maybe compilation errors are not be enough. Maybe we need to test for expected linker errors as well. Why not?

In short, the premise of this post is that *we sometimes need tests for expected build errors as part of a test suite*

How do we do that?

Using `<type_traits>`, SFINAE, and C++20 concepts can get you pretty far. If we use the physical unit library example from above, I think it's sufficient to have a test like `static_assert(!std::is_convertible_v<meters, grams>);`. I've seen some pretty clever However testing certain things with successful builds is sometimes just not possible. With a successful build:

* You can't test that an expected linker error is present
* You can't test that a specific static assertion is triggered
* You can't test that a specific compilation error is triggered

Moreover even if a test with `<type_traits>`, SFINAE, or concepts is possible, it will often require intricate implementation knowledge of the API being tested. Sure, that's not always bad and not necessarily a deal breaker, but writing tests based on implementation details can lead to bugs being reinforced by the test itself[^1].

To avoid these cons, what we need to do is add a bunch of programs with build errors and have tests in our test suite to check that building them produces the expected errors. Unfortunately few build systems have ways of dealing with expected build errors.

Here's what I did with CMake, and why I it is the way it is.

___

[^1]: An (unrealistically) trivial example of how writing tests based on implementation details can reinforce bugs: If you have a buggy function to calculate a triangle area which multiplies the height by the base and forgets to divide by two, if one reads the code, they will implement tests to check just that. They will test that a triangle with height 2 and base 3, has an area of 6, as that's the implementation details they see. When writing tests, always try to come up with expected results without relying on the implementation being tested. Use alternative ways of calculating them.

