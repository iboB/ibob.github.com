---
layout: post
title: A Bug in the C++ Standard
category: programming
tags: ['c++']

excerpt: You think you hate compiler bugs...

lastrev: 2018-08-19 00:40:00 EET
---

> Less than 24 hours after publishing this post, thanks to comments below, on the [Cpplang Slack](https://cpplang.slack.com), and on [reddit](https://www.reddit.com/r/cpp/comments/98j03j/a_bug_in_the_c_standard/), I'm ready for a significant revision. The thing is that changing the post will invalidate a lot of the comments. So, instead I'm going to add several new paragraphs at the end. The most important part of the revision is such: casting `(parent::*member)` to `(child::*member)` in a non-type template argument is in fact *not* a bug in the C++17 standard but a bug, or better yet, a missing feature in the [Itanium C++ ABI](https://itanium-cxx-abi.github.io/cxx-abi/abi.html) used by clang and gcc.

You probably hate compiler bugs. I know I do. Nobody suspects the compiler initially, so you're bound to lose a bunch of time looking for bugs in your own code. Well, you know... it sucks, right?

Now let me tell you, bugs in the standard are worse. The main problem of those is the speed of the fix. To get a fix for a compiler bug is typically fairly slow, but a standard bug? Years at best.

So, what is a bug in the standard, you might ask? *The Standard* is, after all, *the* standard. It's basically the definition of what is or is not a bug. Well, self contradiction is one thing, of course, but those are relatively easy to detect. I don't know of self contradictions in a (released) C++ standard version. So, if we disregard those, this is technically correct ([the best kind of correct](https://www.youtube.com/watch?v=hou0lU8WMgo)). *Technically*, save for self contradictions, oxymorons (oxymora?) and paradoxes, there is no such thing as a bug in the standard.

But... come on! We don't need to throw away common sense. For example if a version of the standard said that `basic_string::length` returns the number of `'\0'` characters in the string, I don't think anyone would mind if we call this a bug.

What I encountered is, of course, a bit more subtle than that but I do still consider it a bug. I'd understand however if some people disagree.

*Now this is a story all about how my code got flipped turned upside down*

You're likely familiar with member functions as template arguments. This is fairly useful for type erasure, signals, other types of runtime polymorphism, and as a whole a good way to deal with the fat pointers associated with member functions. In my case, it's a key part of the dispatch in [DynaMix](https://ibob.github.io/dynamix/).

Here is a simple example:

```c++
struct foo
{
    int some_method(int);
};

template <int (foo::*Method)(int)>
int proxy(foo& f, int n)
{
    return (f.*Method)(n);
}
```

Now you can have a pointer to a function which takes a `foo&` and and `int` and use `proxy` to create it.

```c++
int (*func)(foo&, int) = proxy<&foo::some_method>;
...
foo f;
...
int n = func(f, 4);
```

Change `foo&` to `void*` and you have a nifty way to interop with C.

## A bug in pre-C++17 standards

Now, what if we also want to work with const methods? [No. Problem-o.](https://www.youtube.com/watch?v=mCgr3_Jdo8U&feature=youtu.be&t=4m13s) We just add a template overload of proxy.

```c++
template <int (foo::*Method)(int) const>
int proxy(foo& f, int n)
{
    return (f.*Method)(n);
}
```

And we have a method in `foo` like `int const_method(int) const;`, it will work as expected. [Live demo here](https://godbolt.org/z/oWqTZv).

However, what if we have a `const` overload of `some_method`? Overloads on const-ness are after all a very common thing. Well, now we're out of luck. According to pre C++17 standards, there is literally no way of dealing with this if we keep our `proxy` overloads.

Now, of course without doing anything, there will be ambiguity in this line: `int (*func)(foo&, int) = proxy<&foo::some_method>;`. Your initial idea would be to cast the template argument to the appropriate overload, but expressions like this are not allowed in pre-17 standards. [Live demo here](https://godbolt.org/z/EkQcqU). Change the standard to C++17 and it will work. [C++17 allows constant expressions in template arguments](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n4198.html).

A fun fact about this bug is that it's only visible in clang. MSVC and gcc let this one slide *contradicting the standard* in all of their versions.

Even though this is fixed, I'm not happy with it because DynaMix will just now begin transitioning to C++14. It will be probably 3 more years until C++17 become ubiquitous for all platforms and a transition to 17 will be safe. For now I have to use a workaround where there are no overloads of the proxy function but two different functions `proxy` and `const_proxy`. This works but messes-up some code. Transitioning to C++17 will make things in this regard a lot cleaner.

But this brings me to:

## A pretty active bug in the C++ standard

Let's go back to our first example and instead of dealing with const functions, deal with a parent of `foo`. Let's imagine this hierarchy:

```c++
struct parent
{
    int parent_method(int);
};

struct foo : parent
{
    int some_method(int);
};
```

We now want to use our proxy function to call `parent_method`. The thing is we can't. We absolutely, literally, totally can't. *Technically* (man, I'm beginning to hate "technically") it is not a method of `foo` but of `parent`. So, we get an error. [Live demo here](https://godbolt.org/z/PuTuAv).

Now we can try casting and adding `-std=c++17`:

```c++
int (*pfunc)(foo&, int) = proxy<(int (foo::*)(int))&foo::parent_method>;
```

... but the thing is, this particular cast is not a constant expression in terms ot non-type template arguments[^1]. Clang and gcc both don't allow us to cast the template argument here, even though they [clearly can perform the cast at compile time](https://godbolt.org/z/4k-iG_). Luckily for some, [MSVC does allow this cast](https://godbolt.org/z/xdAAJ2). You can't test it on Compiler Explorer but even MSVC 2005 does allow that cast.

Now I get that this is a standard issue but... come on! This seems trivial. And now because of this I have to deal with a nasty workaround which [spills all the way into user land](https://github.com/iboB/dynamix/blob/8b15d7893f7f98380871c7f7efd9f2a8457fafe0/include/dynamix/message.hpp#L145):

```c++
template <typename T, typename MethodOwner, int (MethodOwner::*Method)(int)>
int proxy(T& f, int n)
{
    return (f.*Method)(n);
}

...
int (*func)(foo&, int) = proxy<foo, foo, &foo::some_method>;
int (*pfunc)(foo&, int) = proxy<foo, parent, &foo::parent_method>;
```

Sad. Ugly. [Live demo here](https://godbolt.org/z/axbMxo).

So, yeah, I do call this a bug in the standard. We should absolutely be allowed to perform that cast. Allow all constant expression casts in non-type template arguments! It's easy!

...

Well, at least it's easy to say.

> This was the end of the post as it was originally published.

## A needed revision and correction

So, yeah... As you've probably seen in the preface, this is not a bug in the standard. I mistakenly interpreted the wording of the standard to think so. It turns out that it's a bug in gcc and clang. More precisely it's a bug in the Itanium C++ ABI which they target. The error message I get is poor but in fact if you change `proxy` from a function template to a class tempalte [clang gives a better error message](https://godbolt.org/z/_y99bn): "sorry, [...] not supported yet".

The actual problem is that the specific mangling that such a template will produce is simply [not supported by the target ABI](https://groups.google.com/a/isocpp.org/forum/embed/?place=forum/std-discussion#!topic/std-discussion/__QDbLgpFik). So even though the code is valid, compilers which target this ABI simply cannot compile it. MSVC and icc compile it without problems (now... I'm pretty sure MSVC compiles it as a side effect of not following the standard too strictly, because even MSVC 2005 can compile this code - 12 years before it was valid - but at least their mangling supports such templates).

Because of this, I hereby change my catchy conclusion slogan to: Mangle all the things! It's easy!... to say.

But wait, there's more!

Several people commented that with C++17 one can just use `auto` non-type template arguments to circumvent the problem. And they are right. This works fine on all C++17 compliant compilers and skipping the type altogether makes the code simpler and more readable. It's by far the best C++17-only solution:

```c++
template <auto Method>
int proxy(foo& f, int n)
{
    return (f.*Method)(n);
}
...
int (*func1)(foo&, int) = proxy<&foo::some_method>;
int (*func2)(foo&, int) = proxy<&foo::parent_method>;
```

[See a live demo here](https://godbolt.org/z/dxP_Km).

But wait, there's even more!

I'm actually very glad I made this blog post, because thanks to comments I was able to actually solve my main problem. The convoluted code to manage `const` overloads of methods in the dispatch in DynaMix is gone. The ugly hack to handle methods of parents referred-to from the children which spilled into user code is gone. And the answer was simple and works with C++11. It's lambdas. If I ditch the proxy function and use a simple lambda to wrap the call, it works great. Non-capturing lambdas are actually regular functions in terms of type, so they can be assigned to a regular function pointer. I feel silly that this simply hadn't dawned on me but hey, I deleted a lot of code thanks to this which is great!

Lambdas do work for me, but they may not necessarily be a good solution for all cases where you would use a proxy function like this one. The main difference is that lambdas you have to write, whereas a proxy function you can simply instantiate. This may be a minor issue depending on the circumstances because such a lambda would typically be just a few lines of code, but who knows? Lambdas work for me because the code I need them in is generated by macros. A few extra lines don't matter. If you do have to manually write them, they may not be the best of ideas. Consider this simple example:

```c++
signal.bind(foo_instance, make_slot<foo, &foo::handler>);
// vs
signal.bind(foo_instance, [](void* instance, int arg1, float arg2, const std::string& arg3) {
    auto f = reinterpret_cast<foo*>(instance);
    f->handler(arg1, arg2, arg3);
});
```

I'd say the first one is much more readable and much more practical as well if you have to write it multiple times for multiple slots.

And... that's that, I guess. I'd like to thank all the people who commented on the initial version of the post. There is no more... Yet?

___

[^1]: This one is a bit more subtle then I initially thought so I think it deserves an explanation. Casting functions in C++ can have two meanings: selection from a list of overloads and an actual cast. The wording of the standard for non-type template arguments is *"If the template-argument represents a set of overloaded functions (or a pointer or member pointer to such), the matching function is selected from the set"*. So even though casting `parent::*member` to `child::*member` is of course an implicit cast and a constant expression, the fact that what I need is a *cast* and not a *selection* makes the operation ineligible for a template argument.