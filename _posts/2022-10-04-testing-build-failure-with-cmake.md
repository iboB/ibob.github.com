---
layout: post
title: Testing for Expected Build Failure with CMake
category: programming
tags: ['c++', 'cmake']

excerpt: We sometimes need tests for expected build errors as part of a test suite. How do we do that?
---

> If you're not interested in the article and the implementation details, and just want a librarified solution for CMake, skip to the section [The Final Solution](#the-final-solution) which summarizes the result and links to a demo.

Sometimes you want to test for compilation errors. A well designed API will try to prevent incorrect usage and implicit dangers with compilation errors as much as possible. Ideally one would have tests to guarantee that certain things just don't compile.

I think it's hard to formalize which expected compilation errors should be tested. To me it's obvious that if you have an API like `void foo(int)`, it's pointless to have a test that calling `foo("haha")` will not compile. To me it's also obvious that if you're creating a physical unit library, you do need a test that a length value can't be assigned to a weight one. But this post is not about when we need such tests. For now let's agree that testing that certain things don't compile is sometimes desired.

I also assume here that we agree that it doesn't count as a test to trigger the required compilation error a couple of times while developing the sofware to make sure that it appears as expected and then leave it at that. As mentioned above, I agree that some behavior doesn't need tests, but the whole point of having tests is to prevent regressions.

And maybe compilation errors are not enough. Maybe you need to test for expected linker errors as well. Why not?

In short, the premise of this post is that *we sometimes need tests for expected build errors as part of a test suite*

How do we do that?

Using `<type_traits>`, SFINAE, and C++20 concepts *can* get you pretty far. With the physical unit library example from above, I think it's sufficient to have a test like `static_assert(!std::is_convertible_v<meters, grams>);`. I've seen some pretty clever uses of SFINAE in such a context. However testing certain things with successful builds is sometimes just not possible. With a successful build:

* You can't test that an expected linker error is present
* You can't test that a specific static assertion is triggered
* You can't test that a specific compilation error is triggered

Moreover even if a test with `<type_traits>`, SFINAE, or concepts is possible, it will often require intricate implementation knowledge of the API being tested. Sure, that's not always bad and not necessarily a deal breaker, but writing tests based on implementation details can lead to bugs being reinforced by the test itself[^1].

To avoid these cons, what we need to do is add a bunch of programs with build errors and have tests in our test suite to check that building them produces the expected errors. Unfortunately few build systems have ways of dealing with expected build errors. CMake, however, allows it.

## What I Did

I've actually ran into this problem several times in the past years. The first time I encountered, back in 2018, as any human being I did a web search and found [this StackOverflow issue](https://stackoverflow.com/q/30155619/1453047). I was never completely satisfied by the proposed solutions, so each time I ended up using tests with static assertions which build successfully. A copule of days ago I decided that enough is enough and created a reusable solution which allows adding tests for expected build failure easily, very much the way the original StakOverflow question asks. Here's how:

Let's say we have a trivial C++ library for which we want to do build-failure tests.

```c++
// mylib.hpp
#include <type_traits>
namespace mylib {
template <typename A, typename B>
auto add(A a, B b) {
    static_assert(std::is_integral_v<A> && std::is_integral_v<B>,
        "add: values must be integral");
    return a + b;
}
}
```

We want a test that the compilation will fail if `mylib::add` is called with non-integral arguments.

```c++
// mylib-build-fail.cpp
#include <mylib.h>
auto test = mylib::add(2.3, 1);
```

Now we need targets whose build fails. CMake allows us to set a target property [`EXCLUDE_FROM_ALL`](https://cmake.org/cmake/help/latest/prop_tgt/EXCLUDE_FROM_ALL.html). Having this property means that unless building the target is explicitly requested, or another, not excluded, target depends on it, it won't be built. For some reason the Visual Studio generators don't respect this property and another one needs to be added so that it's not built by default in Visual Studio as well: [`EXCLUDE_FROM_DEFAULT_BUILD`](https://cmake.org/cmake/help/latest/prop_tgt/EXCLUDE_FROM_DEFAULT_BUILD.html).

So here's the start:

```cmake
# executable, yes. An object library might seem like a less intrusive choice,
# but it won't let us catch linker errors
add_executable(mylib-build-fail-test mylib-build-fail.cpp)
target_link_libraries(mylib-build-fail-test mylib)
set_target_properties(mylib-build-fail-test PROPERTIES
    EXCLUDE_FROM_ALL TRUE
    EXCLUDE_FROM_DEFAULT_BUILD TRUE
)
```

The only way to build this executable now is to explicity request it. So that's the kind of test we can create:

```cmake
add_test(
    NAME mylib-build-fail
    COMMAND ${CMAKE_COMMAND} --build . --target mylib-build-fail-test --config $<CONFIGURATION>
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR} # the place where we would run ctest
)
```

...and then, since we expect this to fail, we can add [the test property](https://cmake.org/cmake/help/latest/prop_test/WILL_FAIL.html) to do so:

```cmake
set_tests_properties(mylib-build-fail PROPERTIES
    WILL_FAIL TRUE
)
```

Now we run this test and the build fails, so the test is sucessful. Done.

...but uh-oh! Did you spot why this build failed?

The code of mylib is in `mylib.hpp` and the test includes `mylib.h`. The reason the compilation fails here is not our static assertion, but the fact that `mylib.h` doesn't exist and can't be included. So yeah, that's one of the dangers of poor design of expected build failure tests. It's simply not enough to test that the build fails. We must test that it fails *as expected*.

What we need to do here is ditch the insufficient `WILL_FAIL` property, and instead use [`PASS_REGULAR_EXPRESSION`](https://cmake.org/cmake/help/latest/prop_test/PASS_REGULAR_EXPRESSION.html). This will test the output of the test with a regular expression and mark the test as passed only if it matches:

```
set_tests_properties(mylib-build-fail PROPERTIES
    PASS_REGULAR_EXPRESSION "add: values must be integral"
)
```

Now the test form above will fail and if we fix the `#include` line, the compilation error output will match the provided string and the test will pass.

Done?

To some this might be enough, and that's perfectly fine. It's not to me, though. I very much dislike the fact that the test is spread between two files (in two different programming languages, even): one which contains the code being tested and another which tests the output against the expected value.

One thing we could do is generate the source for the test from CMake and have the test and the expected output there. I don't like this, too. CMake has very unintuitive substitution and expansion rules, so writing a significant amount of text (or C++ code) in a CMake string can easily lead to pain. Moreover, we won't get syntax highlighting, code completion, and nice C++ editing features. And even more... er... over, since this changes the CMake code, we will *have to reconfigure for every change we make*[^2].

So, I think we can agree that it would be best if the expected error is added to a C++ source file.

We have a single source in our example. Let's change it so that it contains the expected error:

```c++
// mylib-build-fail.cpp
#include <mylib/mylib.hpp>
// build error: add: values must be integral
auto test = mylib::add(2.3, 1);
```

Our DSL is trivial. If a line starts with `// build error:`, the rest of the line is an expected error. Let's parse the source file, and find the expected errors, then add them as a `PASS_REGULAR_EXPRESSION` to our test:

```cmake
# collect errors from source
file(READ mylib-build-fail.cpp sourceText)
string(REGEX MATCHALL "//[ ]*build error:[^\n]+" matchErrors ${sourceText})

# build regular expression list for PASS_REGULAR_EXPRESSION
foreach(possibleError ${matchErrors})
    string(REGEX MATCH "//[ ]*build error:[ \t]*(.+)$" _ "${possibleError}")
    set(possibleError "${CMAKE_MATCH_1}")
    list(APPEND passRegex "${possibleError}")
endforeach()

# add to test
set_tests_properties(mylib-build-fail PROPERTIES
    PASS_REGULAR_EXPRESSION "${passRegex}"
```

But wait! We do have all the data in a single file, but we introduced a subtle issue. Much like the initial `PASS_REGULAR_EXPRESSION` example, a reconfigure is only needed if the expected errors change, but unlike it, CMake wouldn't know to automatically run this step if they do. Before the error was part of the CMake code. If it changes, the reconfigure is automatic. Now it's external and CMake has no way of knowing that a change requires a reconfigure. If a change of the tested error text does happen, we may well forget that we have to reconfigure manually and struggle with failing tests (or worse, passing ones).

What if we make the test itself parse the source file and check for the errors in the output? Sounds good. This also has the added benefit that it doesn't require a reconfigure step even if the expected error text changes[^2]. The best of all worlds!

We can do it by changing the `COMMAND` of the test. Instead of building and checking the output, run a helper script which parses the source, builds the target and tests the output. Something roughly like this:

```cmake
# helper script
execute_process(
    COMMAND ${CMAKE_COMMAND} --build . --target mylib-build-fail-test
    RESULT_VARIABLE res
    ERROR_VARIABLE out
    # pipe OUTPUT_VARIABLE as well
    # *some* compilers (MSVC) report errors to the standard output
    OUTPUT_VARIABLE out
)

if(res EQUAL 0)
    # Build command didn't fail. This means the test fails
    message(FATAL_ERROR "Error: Build didn't fail")
endif()

# collect possible errors from source
file(READ mylib-build-fail.cpp sourceText)
string(REGEX MATCHALL "//[ ]*build error:[^\n]+" matchErrors ${sourceText})

# look for collected errors in output
foreach(possibleError ${matchErrors})
    string(REGEX MATCH "//[ ]*build error:[ \t]*(.+)$" _ "${possibleError}")
    set(possibleError "${CMAKE_MATCH_1}")
    string(FIND "${out}" "${possibleError}" pos)
    if(NOT pos EQUAL -1)
        message("Success: output contains '${possibleError}'")
        return()
    endif()
endforeach()

message(FATAL_ERROR "Error: Building failed, but output doesn't contain any of the expected errors")
```

And then change the `COMMAND` accordingly:

```cmake
add_test(
    NAME mylib-build-fail
    COMMAND ${CMAKE_COMMAND} -P helper.cmake
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR} # the place where we would run ctest
)
```

... no special test properties needed.

Done?

We can test for specific static assertions. We can check for specific compiler or linker errors. We don't depend on hacky succefful builds.

Done.

## The Final Solution

I librarified all this. You can find it as [`icm_build_failure_testing`](https://github.com/iboB/icm/blob/master/icm_build_failure_testing.cmake) in my CMake module collection [icm](https://github.com/iboB/icm). There is a [demo](https://github.com/iboB/icm/tree/master/demo/build_failure_testing) as well.

The following functions are available:

 * `icm_add_build_failure_test` which adds a build failure test. It allows providing the expected error in CMake or in the C++ source, the way described above. It even allows checks that the build simply failed, though this is, as mentioned above, definitely not recommended.
 * `icm_add_multiple_build_failure_tests` to add multiple single-file tests. I assume this would be the most common usage. Instead of doing the somewhat verbose `icm_add_build_failure_test` multiple times, add multiple tests with a single function.

 Check the source for the complete docs. The library is MIT licensed, so feel free to use and modify at will.

## What I Didn't Do

Having the helper script be embedded in `icm_build_failure_testing.cmake` would've been nice. It's always nice to have everyting neatly packed, at least in terms of deployment. CMake 3.18's `file(CONFIGURE` can power this, but it *is* CMake 3.18. I still want to support backwards compatibility with Ubuntu 20.04 and CMake 3.16. I know it's easy to install a more modern version of CMake on Ubuntu, but I don't want to burden deployment.

Having the helper script in yet another language, like Ruby or Python, could have made writing it and making it more powerful considerably easier. For example, creating a more powerful DSL would be a breeze in Ruby and relatively unpleasant in CMake. But, first of all this puts a burden on deployment. At least we can be 100% certain that we have CMake when running this. Second, and this is not to be underestimated, CMake may be an unpleasant language, especially compared to Ruby or Python, but it's quite fast to boot. Like, orders of magnitude faster. With the current solution the speed at which the build tests are executed is bound by the build processes: compiler and linker. With Ruby it would likely be bound by the boot time of the interpreter[^3].

I didn't use `ctest --build-and-test`. Craig Scott, a CMake co-maintainer, and author of [Professional CMake: A Practical Guide](https://crascit.com/professional-cmake/) has a [rather peculiar answer](https://stackoverflow.com/a/50665823/1453047) to the StackOverflow thread from above: to use `ctest --build-and-test`. This would mean that every build failure test is basically a standalone CMake project which is configured and built for each test. To me this simply makes no sense, except for the most trivial of cases. The main problem is transfering all the accumulated target knowledge from the caller to this standalone project. If one uses the required generator expressions and surfaces include directories and targets to the `ctest` call, they still won't be a dependency of it. Running the tests in isolation may lead to unwanted results, for example for linker errors or configured headers. Alternatively one can try to add the same subdirectories in the standalone project, but again, that would lead to code duplication and building the same things over and over again. The second problem is the time it would take to run `ctest` for the first time. Even for the most trivial of examples an initial CMake configure tends to take several seconds. With a project with hundreds of compilation-failure tests, this could lead to *tens of minutes* of configuring stuff when `ctest` runs for the first time. And on a CI host it's typicall that every `ctest` run runs for the first time. This can not be acceptable. Anyway, I might be missing something here, but I can *not* see a benefit in using `ctest --build-and-test` in this scenario.

___

[^1]: An (unrealistically) trivial example of how writing tests based on implementation details can reinforce bugs: If you have a buggy function to calculate a triangle area which multiplies the height by the base and forgets to divide by two, if one reads the code, they will implement tests to check just that. They will test that a triangle with height 2 and base 3, has an area of 6, as that's the implementation details they see. When writing tests, always try to come up with expected results without relying on the implementation being tested. Use alternative ways of calculating them.
[^2]: If you're one of the lucky people who don't care about the reconfigure step of your CMake code, then all cudos to you. I do. In my personal mid-sized projects this takes between 2 and 4 seconds. At my workpace, I work on a pretty big project which takes about 18 seconds to reconfigure, and that's after several iterations of CMake optimizations. I've seen beasts which take well above 20 seconds to reconfigure. That's why I'm always mindful about this step when I write CMake code. Not only about how it affects the reconfigure time, but also how it affects the reconfigure frequency. For example, I don't add headers to target sources, unless I plan on using them in some way. Anyway, I may yet write a post about CMake-specific optimizations.
[^3]: And here I'm itching to go on a long tangent about interpreter preloading, FastCGI, mod_ruby, mruby and stuff like that, but I wont. Maybe in another blog post. This one is long enough as it is.
