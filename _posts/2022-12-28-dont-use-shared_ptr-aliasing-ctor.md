---
layout: post
title: Don't Use shared_ptr's Aliasing Constructor
category: programming
tags: ['c++']

excerpt: Aliased shared pointers can be very useful for type erasure, but the idiomatic way to create them is dangerous
---

Shared pointers can be aliased. Say you have a person and a shared pointer to an instance of it:

```c++
struct person {
    int age;
    std::string name;
}

// ...

auto alice = std::make_shared<Person>("Alice", 38);
```

... then you can make an aliased shared pointer to a Alice's name which uses the same ref count as Alice:

```c++
std::shared_ptr<std::string> name(alice, &alice->name);
assert(alice.use_count() == name.use_count()); // single-threaded use only
```

It's somewhat of a niche feature, but aliased shared pointers can be very useful for type erasure. I use them a lot.

Unfortunately the idiomatic way to create them, through [the aliasing constructor](https://en.cppreference.com/w/cpp/memory/shared_ptr/shared_ptr#:~:text=The%20aliasing%20constructor), is dangerous and can lead to some pretty bizare issues and bugs.

Pop quiz: how do you check if a shared pointer is valid? Just like any other pointer you would use its boolean interface, like `if (ptr)`, right?

I completely agree. In fact if I see a check like `if (some_shared_ptr->use_count() == 0)` in a code review, I would request this to be changed to `if (some_shared_ptr)`. It *is* the idiomatic way of checking pointer validity, shared or other.

But what would happen to our aliased shared pointer `name` from above if `alice` is null and thus fails the boolean check at that point? It will also become null? Nope. It will point to the offset of the member `person::name` (likely 8) in the null pointer to person inside `alice`. So you will get a weird shared pointer which is not null, but whose use count is zero.

But why? As Peted Dimov, the creator of `shared_ptr`, put it: "it's not `shared_ptr`'s job to ignore the arguments you give it because they are dangerous". In this case however I disagree. I consider this a defect of the standard.

In a world where one accepts non-null shared pointers with a zero use count, the way to check for validity should be precisely the `if (ptr->use_count() == 0)` example from above. The one that wouldn't pass a code review with me. And `std::shared_ptr` doesn't even have a member `expired` like weak pointers do, so only this overly verbose check does it.

Now granted, you can use this constructor to create an alias to *something valid* even though the "lifetime carrier" is null. For example:

```c++
std::shared_ptr<void> null;
std::shared_ptr<std::string> weirdo(null, &some_global_string_that_is_always_valid);
```

... and then the boolean checks will pass. This pointer will have a zero use count, but will also be valid forever.

I have not been able to think of a use-case for this. Not one. That, of course, is not to say that there is none. There probably is[^1], but it's the niche of the niche. Also, I would definitely not use a shared pointer for this dangerous invariant. I would create a class which is somewhat similar to `weak_ptr`[^2]. A class that has no boolean interface and no pointer interface, and has explicit checks for the underlying pointer and the expired status. Still, I have not implemented such a class it, because I have no use case for it.

What I have implemented (yes, the whole four lines of it) is a safe function to create "normal" aliased shared pointers[^3]:

```c++
template <typename U, typename T>
std::shared_ptr<T> make_aliased(const std::shared_ptr<U>& owner, T* ptr) {
    if (owner.use_count() == 0) return {};
    return std::shared_ptr<T>(owner, ptr);
}
```

This function will never return a non-null shared pointer with a zero use count. I have banned the use the aliasing constructor where I have the power to do so in favor of this function. I urge you to do the same.

___

[^1]: ...likely found in the comments
[^2]: Similar to `weak_ptr` in terms of interface, and not in terms of functionality
[^3]: Copied verbatim from [itlib-make-ptr](https://github.com/iboB/itlib/blob/master/include/itlib/make_ptr.hpp)
