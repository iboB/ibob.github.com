---
layout: post
title: A Bug in the C++ Standard
category: programming
tags: ['c++']

excerpt: You think you hate compiler bugs...
---

You probably hate compiler bugs. I know I do. Nobody suspects the compiler initially, so you're bound to lose a bunch of time looking for bugs in your own code. Well, you know... it sucks, right?

Now let me tell you, bugs in the standard are worse. The main problem of those is the speed of the fix. To get a fix for a compiler bug is typically fairly slow, but a standard bug? Years at best.

So, what is a bug in the standard, you might ask? *The Standard* is, after all, *the* standard. It's basically the definition of what is or is not a bug. Well, self contradiction is one thing, of course, but those are relatively easy to detect. I don't know of self contradictions in a (released) C++ standard version. So, if we disregard those, this is technically correct ([the best kind of correct](https://www.youtube.com/watch?v=hou0lU8WMgo)). *Technically*, save for self contradictions, oxymorons (oxymora?) and paradoxes, there is no such thing as a bug in the standard.

But... come on. We don't need to throw away common sense. For example if a version of the standard said that `basic_string::length` returns the number of `'\0'` characters in the string, I don't think anyone would mind if we call this a bug.

What I encountered is, of course, a bit more subtle than that, but I do still consider it a bug. I'd understand however if some people disagree.

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

However, what if we have an `const` overload of `some_method`? Overloads on const-ness are after all a very common thing. Well, now we're out of luck. According to the pre C++17 standards, there is literally no way of dealing with this, if we keep our `proxy` overloads.

Now, of course without doing anything there will be ambiguity in this line: `int (*func)(foo&, int) = proxy<&foo::some_method>;`. Your initial idea would be to cast the template argument to the appropriate overload, but expressions like this are not allowed in pre-17 standards. [Live demo here](https://godbolt.org/z/EkQcqU). Change the standard to C++17 and it will work. [C++17 allows constant expressions in template arguments](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n4198.html).

A fun fact about this bug is that it's only visible in clang. MSVC and gcc let this cast slide *contradicting the standard* in all versions.

Even though this is fixed, I'm not happy with it, because DynaMix will just now begin transitioning to C++14. It will be probably 3 more years until C++17 become ubiquitous for all platforms and a transition to 17 will be safe. For now I have to use a workaround where there are no overloads of the proxy function but two different functions `proxy` and `const_proxy`. This works but messes-up some code. Transitioning to C++17 will make things in this regard a lot cleaner.

But this brings me to:

## A pretty active bug in the C++ standard

Let's go back to our first example, and instead of dealing with const functions, deal with a parent of `foo`. Let's imagine this hierarchy:

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

... but the thing is, this particular cast is not a constant expression. Clang and gcc both don't allow us to cast the template argument here, even though they [clearly can perform the cast at compile time](https://godbolt.org/z/4k-iG_). Luckily for some [MSVC does allow this cast](https://godbolt.org/z/xdAAJ2). You can't test it on Compiler Explorer but even MSVC 2005 does allow that cast.

Now I get that this is a standard issue, but... come on. This seems trivial. And now because of this I have to deal with a nasty workaround which [spills all the way into user land](https://github.com/iboB/dynamix/blob/master/include/dynamix/message.hpp#L145):

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

So, yeah, I do call this a bug in the standard. We should absolutely be allowed to perform that cast. Make all casts constant expressions. It's easy!

...

Well, at least it's easy to say.


