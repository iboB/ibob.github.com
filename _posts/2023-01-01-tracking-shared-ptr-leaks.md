---
layout: post
title: Tracking Shared Pointer Leaks
category: programming
tags: ['c++']

excerpt: There are many good practices one can employ. I won't delve into good practices here. I'll go for the heavy guns
---

Let's talk about shared pointer leaks. In a piece of software which makes heavy use of shared pointers such leaks are possible. They are very hard and annoying to deal with. They are also very hard to identify in the first place.

But first...

## What Are Shared Pointer Leaks?

A "classic" leak would be memory[^1] not being freed after use. Smart pointers including shared ones are there to prevent just that. They free the memory appropriately in their destructors.

Shared pointers specifically use reference counting. Every copy of a shared pointer increases the reference count, also known as a *use count*, in an object shared between them called a *control block*. Every shared pointer destructor decreases the use count. In the destructor of the last shared pointer to reference a given control block, this count would reach zero and the associated resource will be destroyed and the associated memory likely freed. Why the use of "likely"? Some shared pointers such as `std::shared_ptr` also allow non-owning weak pointers (`std::weak_ptr`). A weak pointer will also reference a control block, but won't touch the associated use count. Instead it would use a different counter - the weak count. Thus if all shared pointers for a control block get destroyed, the strong use count will reach zero and the managed resource will be destroyed. However if weak pointers remain, the weak count will not be zero and the memory allocated for the control block will still be preserved. When all weak pointers also get destroyed (or if there were none to begin with) the weak count will reach zero and only then will the control block be freed and all trace of our object will evaporate from the process.

As you can see this presents us with several leak opportunies:

* **Circular referencing**. If an object in a shared pointer *A* references another object through a shared pointer *B*, and *B* also references *A* in the same manner, the use count can never reach zero. In a dead lock of sorts each object has to be destroyed for the other to be destroyed. The cycle can be long, spanning tens of objects, or short: an object may end-up holding a reference to itself.
* **Loose references**. A shared pointer may make its way in a global collection like a manager, a log, or a garbage collector, and due to a bug or an oversight not get removed from there. Only stopping the process clears the memory
* **Weak leaks**[^2]. Basically the same as above but with weak pointers. The objects do get destroyed but the memory for the control blocks remains.

Noticing these leaks can be pretty hard. Typically they are noticed when the memory begins growing uncontrollably and at this point it's usually hard (or impossible) to tell exactly which use of shared pointers is to blame. Moreover, due to the facts that even with heavy use, shared pointers are not typically found in hot loops and new shared pointers don't have a high velocity of creation, the suspicious memory growth can take hours, or days, or weeks of run time to become noticeable. Getting a stable repro of such an issue can be quite annoying.

Now, there are many good practices one can employ in order to minimize the chance of a shared pointer leak. Unfortunately mistakes can be made. Bugs can happen. I won't delve into good practices here. By all means employ them, but if there is a shred of doubt in their effectiveness in a given situation, one needs something "heavier".

## Something Heavier Than Good Pracices

This really got me thinking a couple of months ago.

First, what do classic leak detectors do? They log every allocation and every deallocation. At a given point they can provide information about an allocated block, or about all currently living allocated blocks. They can't "know" whether something is a leak. They can strongly suspect so at termination time, but deliberatly not freeing memory upon termination is a widely practiced, though dubious, pattern. Still, in the middle of execution a leak detector can't possibly tell whether an allocated block is a leak or not.

This can still be useful. If I log all currently allocated blocks (or a select suspicious few), with my domain knowledge I can find or clear leak suspects based on the provided metadata. "Hey, I don't expect this 10 MB buffer, allocated two hours ago in `allocate_temp_blob` to be still alive at this point!"

So, it's settled. I'll attach metadata to each shared pointer control block. Then I can log the current state of affairs and find or clear suspects. "Hey, `SessionManager::m_activeSessions` should not a hold a reference to a session which disconnected an hour ago!". Great! How do I do that?

Ok, how do classic leak deterctors work? They [hook](https://www.gnu.org/software/libc/manual/html_node/Hooks-for-Malloc.html) themselves to `malloc` and `free` or [sometimes](http://wyw.dcweb.cn/leakage.htm) to `new` and `delete` and collect metadata at these points. This is relatively easy and is a documented extension point.

Can this be done for the control block of `std::shared_ptr`?

Nope.

The control block is not standardized. It's opaque and an implementation detail for all intents and purposes. The only way to achieve such behavior would be to reimplement `std::shared_ptr` with a custom control block defined by the implementation.

So I [went ahead and did that](https://github.com/iboB/xmem) in a library I called **xmem**.

## xmem

In short xmem is an alternative implementation of the smart pointers from the standard header `<memory>`: `unique_ptr`, `shared_ptr`, and `weak_ptr`. It's a drop-in replacement, too. You should be able to replace all instances of these pointers in a codebase from `std::` to `xmem::` and achieve the exact same functionality.

Notably it offers several additional features: the most important one being that the control block (or the control block factory, rather) is a template argument to `shared_ptr` and `weak_ptr`. It can be replaced with one which collects metadata, which can then be logged and inspected at a given point. Replacing the control block can be used for other features as well. One side effect of this is that `local_shared_ptr`[^3] is possible and [implemented](https://github.com/iboB/xmem/blob/master/code/xmem/local_shared_ptr.hpp).

The main drawback is that it's not just an optional plug-in for existing code. To make use of it, you must change the uses of `std::shared_ptr` to `xmem::shared_ptr` and so on. One can conditionally compile say `mymem::shared_ptr` to be one or the other, but it would still involve a significant code change.

## How Does Tracking Work?

A `shared_ptr` instance refers to an object. A `weak_ptr` instance referes to a control block. Every time a referer is added (via copying or creation), or changed (via moving or swapping), the control block gets notified with special method calls. The default implementation of the notification methods is empty, thus achieving identical behavior and performance to standard shared and weak pointers[^4].

Since the control block factory is a template argument, one can change the default identity control block to be something else. Something which records metadata at the given notification points. Thus the information which living pointers refer to an object and a control block can be queried at any time.

If collecting the information for every single pointer instance is too much and overburdens the system, one has the power to choose collect it only for certain pointee types, or even for selected "suspicious" pointer instances.

I guess it will all become easier to understand with...

## An Example

*This is a step-by-step replication of the library example [shared_ptr-leak](https://github.com/iboB/xmem/blob/master/example/e-shared_ptr-leak.cpp)*

Let's create a program with a shared pointer leak:

```c++
#include <iostream>
#include <memory>
#include <vector>
#include <ctime>
#include <cstdlib>

using session = int;

auto session_factory(int id) {
    return std::make_shared<session>(id);
}

int main() {
    std::shared_ptr<session> leak;

    std::vector<std::weak_ptr<session>> registry;

    constexpr int N = 20;
    srand(unsigned(std::time(nullptr)));
    auto i_to_leak = rand() % (2 * N);
    for (int i = 0; i < N; ++i) {
        auto sptr = session_factory(i);
        registry.push_back(sptr);
        if (i == i_to_leak) {
            leak = sptr;
        }
    }

    for (auto& w : registry) {
        if (w.use_count()) {
            std::cout << "found a leak in " << w.lock() << "\n";
        }
    }
}
```

As you can see, this program collects weak pointers to sessions and expects them all to be expired by the time it completes. In about 50% of the cases a stray shared pointer to a session remains. A leak.

Of course in such a small example it's easy to see which shared pointer is the stray one and where it was assigned a session. It's right there, called `leak` on the first line of main. It gets assigned a session on line 25. Easy! A real world piece of software, of course, might not be that simple to debug.

Let's try and make the program itself reproduce this information.

First, as mentioned before, we will have to ditch `<memory>`, `std::shared_ptr`, and `std::weak_ptr` for xmem and its smart pointer counterparts. Let's say that we will use standard smart pointers most of the time to avoid worying about third party software and only resort to xmem occasionally, when we suspect leaks or when we run tests. This means that we will need conditional compilation to choose one or the other:

```c++
#define TRACK_SHARED_PTR_LEAKS 1

#if TRACK_SHARED_PTR_LEAKS
#include <xmem/shared_ptr.hpp>
#include <xmem/ostream.hpp> // so we can cout << xmem::shared_ptr

namespace myapp {
template <typename T>
using shared_ptr = xmem::shared_ptr<T>;
template <typename T>
using weak_ptr = xmem::weak_ptr<T>;
template <typename T, typename... Args>
[[nodiscard]] shared_ptr<T> make_shared(Args&&... args) {
    return xmem::make_shared<T>(std::forward<Args>(args)...);

}
}

#else

#include <memory> // don't include <memory> otherwise
namespace myapp {
template <typename T>
using shared_ptr = std::shared_ptr<T>;
template <typename T>
using weak_ptr = std::weak_ptr<T>;
template <typename T, typename... Args>
[[nodiscard]] shared_ptr<T> make_shared(Args&&... args) {
    return std::make_shared<T>(std::forward<Args>(args)...);

}
}

#endif
```

We defined `myapp::shared_ptr`, `myapp::weak_ptr`, and `myapp::make_shared` to mean xmem pointers or `std` pointers. The code is almost identical, and behaviour is exactly identical. We mentioned the default implementation of the control block is the same as the standard one. Doing just this is not enough to gain metadata for our pointers. It's still an important step in the process because it ensures that the code builds and works with both sets of pointers.

We will now focus on the xmem part of this `#if` check. As a second step of the setup, we will reimplement `xmem::shared_ptr` to still be identical to `std::shared_ptr` but with the code expanded so we can see where our metadata collection will happen.

Replacing the control block can be very powerful, but during the implementation I noticed there is a lot of copy-pastable boilerplate involved in the typical cases. That's why I created the header [`xmem/common_control_block.hpp`](https://github.com/iboB/xmem/blob/master/code/xmem/common_control_block.hpp). It contains most of the boilerplate in reusable template classes.

So, using it, we can continue:

```c++
#if TRACK_SHARED_PTR_LEAKS
#include <xmem/common_control_block.hpp>
#include <xmem/atomic_ref_count.hpp>
#include <xmem/ostream.hpp>

namespace myapp {

using bookkeeping_control_block = xmem::control_block_base<xmem::atomic_ref_count>;

using bookkeeping_control_block_factory = xmem::control_block_factory<bookkeeping_control_block>;

template <typename T>
using shared_ptr = xmem::basic_shared_ptr<bookkeeping_control_block_factory, T>;

template <typename T>
using weak_ptr = xmem::basic_weak_ptr<bookkeeping_control_block_factory, T>;

template <typename T, typename... Args>
[[nodiscard]] shared_ptr<T> make_shared(Args&&... args) {
    return shared_ptr<T>(bookkeeping_control_block_factory::make_resource_cb<T>(
        std::allocator<char>{}, std::forward<Args>(args)...));
}

}

#else // ...
```

With this we reimplemented `xmem::shared_ptr` in `myapp::shared_ptr`. We did create the type `bookkeeping_control_block`, but it does no bookkeeping yet. It continues to have behavior identical to the standard control block which can be found in `std::shared_ptr`. And this control block is what we're going to change. The rest of the typedefs below it can remain exactly the same.

To have `xmem::basic_shared_ptr` and `xmem::basic_weak_ptr` compile, the control block needs to have a set of methods. `control_block_base<atomic_ref_count>` naturally has them, so instead of reimplementing them, let's make use of it in our bookkeeping implementation:

```c++
class bookkeeping_control_block : protected xmem::control_block_base<xmem::atomic_ref_count> {
public:
    using super = xmem::control_block_base<xmem::atomic_ref_count>;

    // new shared pointer created
    void init_strong(const void* src) noexcept {
        super::init_strong(src);
    }

    // increment use count (shared_ptr copy)
    void inc_strong_ref(const void* src) noexcept {
        super::inc_strong_ref(src);
    }

    // decrement use count (shared_ptr destoyed, reset, or overwritten)
    void dec_strong_ref(const void* src) noexcept {
        super::dec_strong_ref(src);
    }

    // icrement use count only if not zero (weak_ptr lock)
    bool inc_strong_ref_nz(const void* src) noexcept {
        if (super::inc_strong_ref_nz(src)) {
            return true;
        }
        return false;
    }

    // control block transferred between shared pointers (move or swap)
    void transfer_strong(const void* dest, const void* src) {
        super::transfer_strong(dest, src);
    }

    // get use count
    using super::strong_ref_count;

    // increment weak count (weak_ptr copy)
    using super::inc_weak_ref;

    // decrement weak count (weak_ptr destoyed, reset, or overwritten)
    using super::dec_weak_ref;

    // control block transferred between weak pointers (move or swap)
    using super::transfer_weak;
};
```

Since our application only cares for the use count and not the weak count, we provided no bodies to the weak count functions. We will add our bookkeeping code in the use count ones. For now however `bookkeeping_control_block` still does no bookkeeping. It is yet another reimplementation of the default and standard control block. Those `void` pointers? They are the `shared_ptr` instances which triggered those calls.

Now, what kind of bookkeeping shall we do here? How about we store the stacktrace for the point where each shared pointer acquired a reference to the object. For this we will use two new functions, `on_new_strong` and `on_destroy_strong`. We will store the information for a shared pointer in the first and we will remove it in the second. First let's add the calls:

```c++
class bookkeeping_control_block : protected xmem::control_block_base<xmem::atomic_ref_count> {
public:
    using super = xmem::control_block_base<xmem::atomic_ref_count>;

    void on_new_strong(const void* src) {}

    void on_destroy_strong(const void* src) {}

    void init_strong(const void* src) noexcept {
        super::init_strong(src);
        on_new_strong(src); // new pointer here
    }

    void inc_strong_ref(const void* src) noexcept {
        super::inc_strong_ref(src);
        on_new_strong(src); // new pointer here
    }
    void dec_strong_ref(const void* src) noexcept {
        on_destroy_strong(src); // remove pointer here
        super::dec_strong_ref(src);
    }
    bool inc_strong_ref_nz(const void* src) noexcept {
        if (super::inc_strong_ref_nz(src)) {
            on_new_strong(src); // new pointer here
            return true;
        }
        return false;
    }

    void transfer_strong(const void* dest, const void* src) {
        super::transfer_strong(dest, src);
        // on a transfer we...
        on_new_strong(dest); // have a new pointer in dest
        on_destroy_strong(src); // lost a pointer with src
    }

    // ...
};
```

Let's store the stacktrace for each pointer in our two new functions. For the stacktrace, I'm using a simple stacktrace library: [b_stacktrace](https://github.com/iboB/b_stacktrace)[^5]. Since we're anticipating multi-threaded usage, we will also add a mutex lock for the cases where we update the bookkeeping information. We will also store the creation time of the control block. Thus we can track its lifetime completely

```c++
class bookkeeping_control_block : protected xmem::control_block_base<xmem::atomic_ref_count> {
    std::time_t m_creation_time;
    stacktrace m_creation_trace;

    struct entry {
        const void* ptr; // associated shared pointer
        stacktrace trace;
    };
    mutable std::mutex m_mutex;
    std::vector<entry> m_active_strong;
public:
    bookkeeping_control_block()
        : m_creation_time(std::time(nullptr))
        , m_creation_trace(stacktrace::init)
    {}

    void on_new_strong(const void* src) {
        std::lock_guard _l(m_mutex);
        auto& e = m_active_strong.emplace_back();
        e.ptr = src;
        e.trace.record();
    }

    void on_destroy_strong(const void* src) {
        std::lock_guard _l(m_mutex);
        auto f = std::find_if(m_active_strong.begin(), m_active_strong.end(),
            [&](const entry& e) { return e.ptr == src; });
        m_active_strong.erase(f);
    }
    // ...
};
```

Now we only need query functions for the bookkeeping data:

```c++
class bookkeeping_control_block : protected xmem::control_block_base<xmem::atomic_ref_count> {
public:
    // ...
    const time_t& creation_time() const { return m_creation_time; }
    const stacktrace& creation_trace() const { return m_creation_trace; }
    void log_active_strong(std::ostream& out) const {
        std::lock_guard _l(m_mutex);
        for (auto& ref : m_active_strong) {
            out << ref.ptr << ":\n";
            out << ref.trace << "\n";
        }
    }
};
```

We don't need locks for the creation data, but we need a lock for the active strong refs list. It can be updated at any point.

The last thing we need to do is log the bookkeeping data in main at the point where we detected the leak:

```c++
for (auto& w : registry) {
    if (w.use_count()) {
#if TRACK_SHARED_PTR_LEAKS
        std::cout << "\n====================\n";
        std::cout << "found a leak:\n";
        auto cb = w.t_owner();
        auto tm = std::localtime(&cb->creation_time());
        std::cout << "in object: " << cb << " created on " << std::put_time(tm, "%c %Z") << " here:\n";
        std::cout << cb->creation_trace();
        std::cout << "\nwith living refs:\n";
        cb->log_active_strong(std::cout);
#else
        std::cout << "found a leak in " << w.lock() << "\n";
#endif
    }
}
```

Then after we start the program several times until we get a leak, we can confirm which pointer leaked where:

<pre class="highlight"><code>
====================
found a leak:
in object: 0000027B1408E6E0 created on 12/30/22 20:45:27 FLE Standard Time here:
C:\cpmcache\b_stacktrace\8f002d8131cb3c66e10d56856149f16395c99c44\b_stacktrace.h(184): b_stacktrace_get
C:\prj\xmem\example\e-shared_ptr-leak.cpp(41): myapp::stacktrace::record
C:\prj\xmem\example\e-shared_ptr-leak.cpp(36): myapp::stacktrace::stacktrace
C:\prj\xmem\example\e-shared_ptr-leak.cpp(71): myapp::bookkeeping_control_block::bookkeeping_control_block
C:\prj\xmem\code\xmem\common_control_block.hpp(63): xmem::control_block_resource&lt;myapp::bookkeeping_control_block,int,std::allocator&lt;char&gt; &gt;::control_block_resource&lt;myapp::bookkeeping_control_block,int,std::allocator&lt;char&gt; &gt;
C:\prj\xmem\code\xmem\common_control_block.hpp(71): xmem::control_block_resource&lt;myapp::bookkeeping_control_block,int,std::allocator&lt;char&gt; &gt;::create
C:\prj\xmem\code\xmem\common_control_block.hpp(120): xmem::control_block_factory&lt;myapp::bookkeeping_control_block&gt;::make_resource_cb&lt;int,std::allocator&lt;char&gt;,int &amp;&gt;
C:\prj\xmem\example\e-shared_ptr-leak.cpp(161): myapp::make_shared&lt;int,int &amp;&gt;
<span class="cp">C:\prj\xmem\example\e-shared_ptr-leak.cpp(184): session_factory
C:\prj\xmem\example\e-shared_ptr-leak.cpp(196): main</span>
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_common.inl(79): invoke_main
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_common.inl(288): __scrt_common_main_seh
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_common.inl(331): __scrt_common_main
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_main.cpp(17): mainCRTStartup
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_main.cpp(17): BaseThreadInitThunk
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_main.cpp(17): RtlUserThreadStart

with living refs:
000000D48C6FFC78:
C:\cpmcache\b_stacktrace\8f002d8131cb3c66e10d56856149f16395c99c44\b_stacktrace.h(184): b_stacktrace_get
C:\prj\xmem\example\e-shared_ptr-leak.cpp(41): myapp::stacktrace::record
C:\prj\xmem\example\e-shared_ptr-leak.cpp(89): myapp::bookkeeping_control_block::on_new_strong
C:\prj\xmem\example\e-shared_ptr-leak.cpp(113): myapp::bookkeeping_control_block::inc_strong_ref
C:\prj\xmem\code\xmem\basic_shared_ptr.hpp(174): xmem::basic_shared_ptr&lt;xmem::control_block_factory&lt;myapp::bookkeeping_control_block&gt;,int&gt;::init_from_copy&lt;int&gt;
C:\prj\xmem\code\xmem\basic_shared_ptr.hpp(35): xmem::basic_shared_ptr&lt;xmem::control_block_factory&lt;myapp::bookkeeping_control_block&gt;,int&gt;::operator=
<span class="cp">C:\prj\xmem\example\e-shared_ptr-leak.cpp(199): main</span>
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_common.inl(79): invoke_main
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_common.inl(288): __scrt_common_main_seh
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_common.inl(331): __scrt_common_main
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_main.cpp(17): mainCRTStartup
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_main.cpp(17): BaseThreadInitThunk
D:\a\_work\1\s\src\vctools\crt\vcstartup\src\startup\exe_main.cpp(17): RtlUserThreadStart
</code></pre>

A session was assigned to the stray pointer called `leak` in `main`, line 199?! Who would've thought!

___

[^1]: ...or any type of manually managed resource
[^2]: I tried to incorporate a "clever" pun here, but ultimately decided against it. I came up with WikiLeaks, weaklings, weak leeks, and weekly eeks. Choose whatever is funniest to you and laugh, please.
[^3]: `local_shared_ptr` would be a pointer which doesn't have atomic ref counting but regular non-atomic one. In a single-threaded scenario it's a bit faster than the regular `shared_ptr`, especially on ARM or other non-x86 architectures. [Boost offers this type as well](https://www.boost.org/doc/libs/1_78_0/libs/smart_ptr/doc/html/smart_ptr.html#local_shared_ptr).
[^4]: Well, as long as these empty function calls get optimized away, which is pretty much guaranteed with `-O1` and more, but is not guaranteed with `-O0`. Still, with `-O0` an empty function call here and there will likely be the least of your performance issues.
[^5]: ...which I will gladly ditch when C++23's [`<stacktrace>`](https://en.cppreference.com/w/cpp/header/stacktrace) finally arrives.
