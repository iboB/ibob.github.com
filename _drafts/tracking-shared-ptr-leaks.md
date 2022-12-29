---
layout: post
title: Tracking Shared Pointer Leaks
category: programming
tags: ['c++']

excerpt: There are many good practices one can employ. I won't delve into good practices here. I'll go for the heavy guns
---

Let's talk about shared pointer leaks. In a piece of software which makes heavy use of shared pointers, these types of leaks are possible. They are very hard and annoying to deal with. They are also very hard to identify in the first place.

But first...

## What Are Shared Pointer Leaks?

A "classic" leak would be memory[^1] not being freed after use. Smart pointers including shared ones are there to prevent just that. They free the memory appropriately in their destructors.

Shared pointers specifically use reference counting. Every copy of a shared pointer increases the reference count, also known as a *use count*, in an object shared between them called a *control block*. Every shared pointer destructor decreases the use count. In the destructor of the last shared pointer to reference a given control block, this count would reach zero and the associated resource will be destroyed and the associated memory likely freed. Why the use of "likely"? Some shared pointers such as `std::shared_ptr` also allow non-owning weak pointers (`std::weak_ptr`). A weak pointer will also reference a control block, but won't touch the associated use count. Instead it would use a different counter - the weak count. Thus if all shared pointers for a control block get destroyed, the strong use count will reach zero and the managed resource will be destroyed. However if weak pointers remain, the weak count will not be zero and the memory allocated for the control block will still be preserved. When all weak pointers also get destroyed (or if there were none to begin with) the weak count will reach zero and only then will the control block be freed and all trace of our object will evaporate from the process.

As you can see this presents us with several leak opportunies:

* **Circular referencing**. If an object in a shared pointer *A* references another object through a shared pointer *B*, and *B* also references *A* in the same manner, the use count can never reach zero. In a dead lock of sorts each object has to be destroyed for the other to be destroyed. The cycle can be long, spanning tens of objects, or short: an object may end-up holding a reference to itself.
* **Loose references**. A shared pointer may make its way in a global collection like a manager, a log, or a garbage collector, and due to a bug or an oversight not get removed from there. Only stopping the process cleares the memory
* **Weak leaks**[^2]. Basically the same as above but with weak pointers. The objects do get destroyed but the memory for the control blocks remains.

Noticing these leaks can be pretty hard. Typically they are noticed when the memory begins growing uncontrollably and at this point it's usually hard (or impossible) to tell exactly which use of shared pointers is to blame. Moreover, due to the facts that even with heavy use, shared pointers are not typically found in hot loops and new shared pointers don't have a high velocity of creation, the suspicious memory growth can take hours, or days, or weeks of run time to become noticeable. Getting a stable repro of such an issue can be quite annoying.

Now, there are many good practices one can employ in order to minimize the chance of a shared pointer leak. Unfortunately mistakes can be made. Bugs can happen. I won't delve into good practices here. By all means employ them, but if there is a shred of doubt in their effectiveness in a given situation, one needs something "heavier".

## Something Heavier Than Good Pracices

This really got me thinking several months ago.

First, what do classic leak detectors do? They log every allocation and every deallocation. At a given point they can provide information about an allocated block, or about all currently living allocated blocks. They can't "know" whether something is a leak. They can strongly suspect so at termination time, but deliberatly not freeing memory upon termination is a widely practiced, though dubious, pattern. Still in the middle of execution a leak detector can't possibly tell whether an allocated block is a leak or not.

This can still be useful. If I log all currently allocated blocks (or a select suspicious few), with my domain knowledge I can find or clear leak suspects based on the provided metadata. "Hey, I don't expect this 10 MB buffer, allocated two hours ago in `allocate_temp_blob` to be still alive at this point!"

So, it's settled. I'll attach metadata to each shared pointer control block. Then I can log the current state of affairs and find or clear suspects. "Hey, `SessionManager::m_activeSessions` should not a hold a reference to a session which disconnected an hour ago!". Great! How do I do that?

Ok, how do classic leak deterctors work? They [hook](https://www.gnu.org/software/libc/manual/html_node/Hooks-for-Malloc.html) themselves to `malloc` and `free` of [sometimes](http://wyw.dcweb.cn/leakage.htm) to `new` and `delete` and collect metadata at these points. This is relatively easy and is a documented extension point.

Can this be done for the control block of `std::shared_ptr`?

Nope.

The control block is not standardized. It's opaque and an implementation detail for all intents and purposes. The only way to achieve such behavior would be reimplement `std::shared_ptr` with a custom control block which can do that.

So I [went ahead and did that](https://github.com/iboB/xmem).

## xmem

In short xmem is an alternative implementation of the smart pointers from the standard header `<memory>`: `unique_ptr`, `shared_ptr`, and `weak_ptr`. It's a drop-in replacement, too. You should be able to replace all instances of these pointers in a codebase from `std::` to `xmem::` and achieve the exact same functionality.

It offers several additional features: the most notable one being that the control block (or the control block factory rather) is a template argument to `shared_ptr` and `weak_ptr`. It can be replaced with one which collects metadata, which can then be logged and inspected at a given point. Replacing the control block can be used for other features as well. One side effect of this is that `local_shared_ptr`[^3] is possible and [implemented](https://github.com/iboB/xmem/blob/master/code/xmem/local_shared_ptr.hpp).

The main drawback however is that it's not just an optional plug-in for existing code. To make use of it, you must change the uses of `std::shared_ptr` to `xmem::shared_ptr` and so on. One can conditionally compile say `mymem::shared_ptr` to be one or the other, but it would still involve a significant code change.

___

[^1]: ...or any type of manually managed resource
[^2]: I tried to incorporate a "clever" pun here, but ultimately decided against it. I came up with WikiLeaks, weaklings, weak leeks, and weekly eeks. Choose whatever is funniest to you and laugh, please.
[^3]: `local_shared_ptr` would be a pointer which doesn't have atomic ref counting but regular non-atomic one. In a single-threaded scenario it's a bit faster than the regular `shared_ptr`. [Boost offers this type as well](https://www.boost.org/doc/libs/1_78_0/libs/smart_ptr/doc/html/smart_ptr.html#local_shared_ptr).
