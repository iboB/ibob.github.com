---
layout: post
title: Stop Teaching C++
category: programming
tags: ['c++']

excerpt: Remember that one bad teacher you had who made you hate that one subject and you probably still hate it to this day? C++ is that bad teacher and programming is the subject.
---

**... as a First Language**

Clickbait title, I know, but it's an homage to the famous talk by Kate Gregory: ["Stop Teaching C"](https://www.youtube.com/watch?v=YnWhqhNdYyk).

I've had this discussion many times here and there, so I decided to collect my arguments in this post.

**Teaching C++ as a first programming language to beginners in programming is a Bad Idea&trade;.**

Remember that one bad teacher you had who made you hate that one subject and you probably still hate it to this day? C++ is that bad teacher and programming is the subject.

*"But why? My first language was C++ and I turned out fine"* is what I often keep hearing. 

You probably started programming in the 90's. Back then C++ was a decent choice. I could argue that there were better ones even then, but C++ was not that much worse. It didn't matter that much. Nowadays we have modern languages with modern ecosystems which make it so much easier to start it's embarrassing.

A key part of learning to program is playing with existing code. Think of what the introduction to programming is. It might be the first lecture in a course, it might be realizing that those things which run on your computer and phone are made by actual humans and you can be one of those humans. The role of the intro is to motivate and inspire. In your first days as a beginner you are inspired and you have ideas. You, as a student and newbie, don't have the capability to create everything you want, but some people already have created similar things. You can make use of this. This can help you learn more and better. This helps you be creative early on. Actually being able to work on something worthwhile is a great motivator. Showing off might be a great motivator, too. It might seem cheesy, but it's human nature, especially so among young people who are the most likely pupils in a beginners course in programming. 

Which brings us to C++.

C++ does not have a build system. Oh yes, it has autotools, nmake, MSBuild, CMake, premake, QMake, SCons, ninja, Meson, FASTbuild, Sharpmake, maven, Gradle, gyp, jom, and, actually many, many more. You know what I'm saying?...

[![xkcd 927](https://imgs.xkcd.com/comics/standards.png)](https://xkcd.com/927/) <br/><small>[xkcd by Randall Munroe](https://xkcd.com/927/)</small>

Mostly because of this, C++ doesn't have a package manager. Oh, there are conan, vcpkg, Buckaroo, git submodules, apt, yum, packman, brew, and a ton more, but... you get where I'm going with this. Also, package managers are still not that popular in C++ circles, so too many projects use some ad hoc solution which suits their needs alone.

So, which build system should be taught? Which package manager? This or that, or none? GitHub and similar sites make it very easy to find code and the students will want to reuse it, but they will inevitably encounter problems. They will lose time and experience frustration. A lot of them will give up. Maybe some of them will succeed... if they were lucky enough to encounter libraries which are easy to integrate.

![Is this package management?](/blog/cpp-package-butterfly.jpg)

I've seen frustration and desperation even in seasoned professionals trying to incorporate some library with obscure build process in their code. I've  experienced it myself. (I'm looking at you [tensorflow](https://github.com/tensorflow/tensorflow))

And as if this is not enough, C++ has a... well, a bare-bones standard library. With it there is no way to do networking, or GUI, or any graphics at all for that matter. Working with freaking *directories* was first introduced in C++17. I've seen universities as late as 2016 teach C++ using Visual Studio 6. By the time they reach C++17,  humanity will have spread to the stars.

So with all of that combined... you're a beginner in programming. You're taught C++. You have friends who are at your level, but they are taught some other, more beginner-friendly languages. After a couple of weeks of lessons your friends start showing off with some small games, websites, text editors, book catalogs, and all that jazz. Hell, the php guys are already on their second CMS which will "totally kill WordPress". You? You explore yet another way of printing "67" in a terminal window. [How about that?](https://www.google.bg/search?q=flip+table&tbm=isch)

This seemingly embarrassingly slow progress is an awful morale killer. People get discouraged. People abandon C++ and sometimes programming altogether. They think it's not for them. They think the slow progress is their fault. Newbies can't realize that instead of learning the fundamentals of programming, they spend the majority of their time battling the specific idiosyncrasies of C++ development.

Then there's more. All of the above pretty much applies to other languages as well. For example C, or Assembly... or Fortran. And even though "computer science without Fortran and COBOL is like a chocolate cake without ketchup and mustard,"[^1] I think all of these would be a better choice for a first programming language than C++. Because C++ is complex. Very, very complex.

C++ is three languages in one. There's C-with-classes which is not that hard. Just a bit harder than Java or C# since it doesn't have garbage collection and you have to think about that, but really, quite OK for beginners. Then there's the preprocessor language which is also present in C. It's not *that* heavily used in most C++ codebases, even though you *do have* to use it for includes and include guards, but that's just a very small subset. Then there's the language of templates and metaprogramming. It is a full-fledged, Turing-complete, functional programming language with terrible syntax, within C++. 

The language of templates is a terrible way to get introduced to functional programming. I can see people growing to hate functional programming altogether if that's their first encounter with it. Not only is its syntax bad, but it's really dangerous without care. Even experts have been seduced by its apparent power, only to fall victim to compilation times in the tens of minutes or hours. That isn't to say that it's impossible to write practical code with it. It's just hard. One of the best attempts in doing so is [[Boost].tmp](https://github.com/odinthenerd/tmp) by [Odin Holmes](https://twitter.com/odinthenerd) and it essentially mimics the principles behind Haskell - lazy evaluation, currying, and monadic functions[^2]. So imagine teaching this to beginners. They don't care that "a monad is just a monoid in the category of endofunctors."[^3]

And then there's UB: undefined behavior. In C++ some things which intuitively seem perfectly legitimate are, in fact, undefined behavior - you should never rely on this, even if you consistently observe it to work. Now, this is a conscious decision and it greatly helps with optimizing code, but it's yet another level of complexity in the language. Also, hearing the sentence "it works but it's wrong" is yet another way to bring your morale to negative values.

The counter argument here is: *"Well naturally I won't teach this complex stuff. I know it's too much. I will only cover the basics."*

Of course, no one teaching C++ at a beginner level teaches the entirety of the language. It's just impossible. But these complexities are not just hidden behind syntactic sugar or the compiler. They are a part of the language. They are a part of the standard library. Having to deal with them is inevitable. Even if the teacher chooses to skip pointers, or templates, or operator overloading, the students are bound to come across them. And then, being good curious students, they start asking questions for which an answer can be hours long. The answer can sometimes be worthy of a class of its own. Of course, there is no time to answer everything completely. The mantra of "it is what it is" becomes a regularity. The morale suffers.

And until now I wasn't even questioning the competence of the teacher, which given the complexity of the language and the high demand of competent programmers from the industry, is iffy at best. Oftentimes people teaching beginner courses are beginners in the concrete topic themselves. This is terrible for a language like C++. If there's anything we've learned, it's that C++ is not like other languages. Sure, you can assign a 70-year-old expert in Fortran to teach programming basics with Java. It's not *that* different. No, really. Make them teach C++ and they are in a world of hurt. You can't just take a piece of the language and teach it in isolation. This would be combining a bad first language with a bad teacher. The worst of all worlds.

A popular response to all this is: *"But I want to write games/&lt;insert favorite tech here&gt;. I heard that they are written in C++, so I have to learn C++.*

I should be very clear that I'm not against C++ being taught at all, or used, for that matter. This post is not a critique of C++. *I know* why those things exist. I may not agree with all decisions by the standards committee, but I understand their reasoning. I am a C++ programmer and I love (and naturally, at times hate) my language of choice. But I do realize that it's a bad choice for beginners. I do want more people to learn programming. I do want more people to try C++. I just don't think starting with it is the way to go.

Modern software development is based on ever more complex stacks of different technologies and programming languages. There is practically no way to survive in the industry with a single programming language. Don't think that your first language will be the one in which you will write most of your code in the future... or any code at all. Your first language may become your main one which is somewhat unlikely. It may become a secondary language which you use regularly in your work or hobby. It may even become something in your past that only taught you the basics and was but a stepping stone to something you know and like better.

My whole point is that the role of the first programming language is not for you to learn a language to use. It's to teach you the basics of programming *while being in your way with its own specifics and quirks as little as possible*. C++ is not such a language. Don't teach C++ to beginners![^4]

___

[^1]: Not my quote. The source is unknown for all I know. I've seen it attributed to a John Krueger. Maybe that's true.
[^2]: This resemblance between [Boost].tmp and Haskell is accidental, by the way. It's just a reinvention by Odin of a good set of principles which happen to exist elsewhere.
[^3]: "A monad is just a monoid in the category of endofunctors, what's the problem?". Not my quote. I couldn't find the source of that one, too. It's Haskell folklore now.
[^4]: PS. By the way, the languages which I would recommend for good first language are: Ruby and C#. Languages which I would call an adequate choice even though I see some issues include: Python, Swift, JavaScript, lua, clojure, Scala, Java, Kotlin, and PHP. But, hey, that's just, like, my opinion, man.