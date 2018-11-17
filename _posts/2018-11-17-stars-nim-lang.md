---
layout: post
title: "Stars: Nim"
category: stars
tags: ['stars', 'language']

excerpt: Nim is a compiled, garbage-collected systems programming language with a design that focuses on efficiency, expressiveness, and elegance (in that order of priority).
---

My second star ever is the programming language Nim. Back then it used to be called Nimrod and I still meet people who remember it only by its old name.

| Summary | |
|---|---|
| Repo     | **Nim** [nim-lang/nim](https://github.com/nim-lang/Nim): Nim is a compiled, garbage-collected systems programming language with a design that focuses on efficiency, expressiveness, and elegance (in that order of priority). |
| License  | **MIT** |
| Language | **Nim**, **C** |
| Status   | Very active. Multiple commits a day. |
| Links    | Website: [nim-lang.org](https://nim-lang.org/), Docs: [nim-lang.org/documentation](https://nim-lang.org/documentation.html) |

## Review

I fear that whatever I do in a short review won't be able to do the language justice. There are many intros, tutorials, and materials for it out there if do a web search, so I'll just create a brief description in my own words. But first as a motivation I'll paste a quote about the language by one of it's main contributors:

> Think of the most beautiful piece of code that you've ever seen. It doesn't have to be something that you've written. It has to be something which touched you. Something for which you could've said "Surely, this is the code of the gods"! Did you think of it? Good. The same beauty and elegance can be accomplished in Nim without the performance penalty you payed to have it in Lisp, or perl, or Ruby, or Haskell, or whatever language the code you imagined was in.<br/>-- [Zahari Karadjov](https://github.com/zah)

So, in short, Nim is a programming language. It's has static and strong types. It has (optional) garbage collection. It looks a bit like Python... well at least superficially because it has indentation-based scoping. It's a fairly mature language, too. There are many editor and IDE integrations, many packages in its package manager -- Nimble -- and, even, by the estimation of the authors, several hundred programmers who write mostly Nim as part of their jobs.

Ideologically Nim tries to be something between Rust and D, I suppose. By that I mean that it's yet another contender for the throne occupied by C++. But there are two things which make it particularly appealing to me:

* **It's designed with metaprogramming in mind.** C++ has powerful metaprogramming. D even more so but both are languages of the C family and the metaprogramming features feel like another language added within the original one. This is especially true for C++. Nim is much more consistent in that regard. You write in Nim even if you write code for the compiler. That's because the compiler has a built-in interpreter for the language. This also allows you some pretty nice features, usually reserved for interpreted languages or Lisps, like AST-modifying macros and more.
* **It compiles to C or C++**. Yes. The output of the Nim compiler is C or C++. I think this is great. First you get access to millions of lines of existing code without having to wrap it in libraries and expose it in any special way. Moreover there is interoperability. C and C++ can potentially see Nim's data structures and functions and use them too. You also get all the platforms supported by C and C++, which is literally *all the platforms*. And let's not forget the huge investment in optimizing C and C++ compilers, which you get for free.

So if a currently existing language *is* to displace C++ for the use-cases for which people choose C++ these days, my preference would be for Nim (rather than, say, Rust).

I suggest you give Nim a try. It's definitely worth it.

[Nim is here](https://nim-lang.org/).

{% include stars-post-footer.md %}
