---
layout: post
title: "Concepts, Partial Specialization, and Forward Declarations"
category: programming
tags: ['c++']

excerpt: This One Thing Is Possible With Concepts, but Not With SFINAE. `enable_if` Fans Are Furious
---

I recently started using C++ concepts. Yes, it took me five years. Well, the main reason for avoiding them was the need to support older standards, but also, I didn't see any particular need. The differences between concepts and "old-school" (say, `enable_if`-based) SFINAE are purely cosmetic. There is seemingly nothing which is possible with concepts and impossible with `enable_if`. Concepts are just syntactic sugar. They make some things easier. Plus, they offer (arguably[^1]) better error messages.

## This One Thing Is Possible With Concepts, but Not With SFINAE
### `enable_if` Fans Are Furious

Notice that I did say "seemingly"? Yes, there is one thing which makes concepts superior. There is one thing concepts allow you, which is impossible with pre-C++20 SFINAE. It is extensibility.

Say you have a simple template:

```c++
template <typename Mutex>
struct lock_guard {
    Mutex& m_mutex;
    lock_guard(Mutex& m) : m_mutex(m) { m_mutex.lock(); }
    ~lock_guard() { m_mutex.unlock(); }
};
```

... and now you want to make it work with MFC-style mutexes whose methods are called `Lock` and `Unlock`, capitalized. What can you do? You can specialize individually for all specific lockable classes you need, but that's a lot of copy-pasted code. Had the author of `lock_guard` envisioned your need for extensibility, they could've created `lock_guard` like so:

```c++
template <typename Mutex, typename SFINAE_Hook = void>
struct lock_guard {
    Mutex& m_mutex;
    lock_guard(Mutex& m) : m_mutex(m) { m_mutex.lock(); }
    ~lock_guard() { m_mutex.unlock(); }
};
```

and now you can use partial specialization to make it work:

```c++
template <typename MFCMutex>
struct lock_guard<MFCMutex, std::enable_if_t<is_pascal_case_lockable_v<MFCMutex>>, void>> {
    MFCMutex& m_mutex;
    lock_guard(Mutex& m) : m_mutex(m) { m_mutex.Lock(); }
    ~lock_guard() { m_mutex.Unlock(); }
};
```

Without concepts one has to think and try to envision extension points like this one. With concepts one can just do:

```c++
template <lowercase_lockable Mutex>
struct lock_guard {
    Mutex& m_mutex;
    lock_guard(Mutex& m) : m_mutex(m) { m_mutex.lock(); }
    ~lock_guard() { m_mutex.unlock(); }
};
```

And this is both an extension point *and* prouduces nice[^1] compilation errors when something can't be locked/unlocked like this.

"Wait", I head people saying, "I'm not the author of `lock_guard`! In this example the author of `lock_guard` 'envisioned' that it could be extended by constraining its argument with a concept, just like the author of `lock_guard<Mutex, SFINAE_Hook>` did."

We've come to *The Thing&trade;*: **With concepts you can partially specialize existing templates with a single template argument.**

Partially specialize single template argument? Yes, what used to be an oxymoron pre-C++20 is now a legitimate statement.

```c++
template <typename MFCMutex> requires pascal_case_lockable<MFCMutex>
struct lock_guard<MFCMutex> { ... };
```

Tada! This works with the initial example of `lock_guard<Mutex>`.

Now, granted, this is pretty niche. I don't think I've ever had the need to partially adapt templates outside of my codebase in my entire career. In similar cases I've always been in a position to *add* the SFINAE hook if a template didn't already have one.

So, OK. Let's adopt the *concepts everywhere* mindset. If we are the author of `lock_guard`, why rely on partial specialization? Why not just define it as only valid for `lowercase_lockable` and leave it to users to extend their code with entirely new definitons if needed?

There's a catch. With code written like this, you lose the ability to forward declare things.

## With *This* One Trick You Lose the Ability to Forward Declare Things
### People Who Care About Compilation Times Are Furious

Now, you can still forward declare the templates themselves. `template <lowecase_locakble Mutex> struct lock_guard;` is perfectly fine (well, as long as `lowercase_lockable` is defined) but templates are rarely forward declared. It's much more common to forward declare the template arguments.

Here's a use case:

```c++
template <typename T>
struct intrusive_shared_ptr {
    ...
    ~intrusive_shared_ptr() {
        if (m_obj)
            m_obj->release();
    }
};

...

class foo;
using foo_ptr = intrusive_shared_ptr<foo>;
```

You might be tempted, as I was, to constrain the `T` with concepts:

```c++
template <ref_countable T>
struct intrusive_shared_ptr { ... };
```

... but then our `foo_ptr` cannot be declared. `foo` is incomplete. An incomplete type does not satisfy the `ref_countable` concept.

Oh, well...

So the guideline I use now is:

> For the sake of forward declarations, don't constrain class template arguments, unless you speicifically know that they will not be forward declared

Do I still make use of concepts? Yes. I do prefer their error output, and I enjoy syntactic sugar. Here's how `intrusive_shared_ptr` looks following the guideline:

```c++
template <typename T> // T can be forward declared
struct intrusive_shared_ptr {
    static_assert(ref_countable<T>) // nice error message, thank you
    ...
    ~intrusive_shared_ptr() {
        if (m_obj)
            m_obj->release();
    }
};
```

As for the other example, I think `lock_guard` should definitely fall into the "I know its args won't be forward declared" category. I would define it as `template <lowercase_lockable Mutex>`.

___

[^1]: There are abundant opinions on matter, of course. From "it doesn't matter whether you see 20 lines of `does not satisfy` or 20 lines of `instantiated from`" to even "the verbose template error stack is infinitely more helpful". I, for one, prefer the error messages from concepts.
