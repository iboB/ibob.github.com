---
layout: post
title: Transparent Lookups for Maps and Sets
category: programming
tags: ['c++']

excerpt: A post about yet another thing to be mindful of when writing C++
---

C++14 introduced transparent lookups for `std::map` and `std::set`. C++20 introduced them for `std::unordered_map` and `std::unordered_set`. And, since this is C++, they don't *just work*. So, this is a post about thing #9312 to be mindful of when writing C++. Nothing newsworthy, really.

## What are They?

In short transparent lookups allow you to search for elements without constructing the key type.

Imagine this:

```c++
std::map<std::string, int> m;
auto mf = m.find("a language like C++, but not broken");

std::set<std::string> s;
auto sf = s.find("sense in deprecating atomic load/store on shared_ptr");

std::unordered_map<std::string, int> um;
auto umf = um.find("compile-time reflection done right");

std::unordered_set<std::string> us;
auto usf = us.find("bullet-proof socks and shoes");
```

So, what happens here? Four `std::string`-s are constructed. Four times memory is absolutely pointlessly allocated for ranges which are known at compile time. This problem is quite annoying and it is my opinion that it makes pre-C++14 `std::map/set` and pre-C++20 `std::unordered_map/set` practically useless, even outright a bad choice, when the key is a string.

As you might suspect, an intrusive solution to this problem is trivial and can well work with C++11 and even C++98. The thing is that it *has* to be intrusive. One has to have control over the declaration of the lookup methods and operators of these types. One needs to be able to make them templates by key.

And this is precicely what has been done to these standard containers with C++14 and 20.

However, non-standard containers exist, like the ones in [Boost.Container](https://www.boost.org/doc/libs/1_80_0/doc/html/container.html) and [many](https://github.com/iboB/itlib/blob/master/include/itlib/flat_map.hpp) [other](https://github.com/greg7mdp/sparsepp) [libraries](https://github.com/search?l=C%2B%2B&q=hash+table&type=Repositories) which support transparent lookup for C++11, some even for C++98.

Curiously enough (to me) transparent lookup is very rarely enabled by default, and indeed it isn't for the standard library containers and Boost.Container. Even with C++20 the code from the example above will still allocate strings. Even though lookup methods are templates by key, they won't try to select an overload of `operator<`, `operator==` or specializations of `std::hash` for the types being searched by default. The compare and hash functors need to explicitly allow it and `std::less<T>`, `std::hash<T>`, and `std::equal_to<T>` don't. Not for a concrete T anyway. `std::less<void>` does, though. This is the default value of the template parameter since C++14, but not the default template parameter of the containers themselves.

Thus, to make lookups transparent in `std::map` and `std::set`, compiling with C++14 is not enough. You also need to explicitly specify the compare functor. Like so:

```c++
std::map<std::string, int, std::less<>> m;
auto mf = m.find("one ring to rule them all"); // no std::string here

std::set<std::string, std::less<>> s;
std::string_view k = "one ring to find them";
auto sf = s.find(k); // works with string_view in C++17 as well
```

For the unordered containers it's not that simple. One needs to explicitly define a hash functor which supports all types they intend to hash. Here's an example:

```c++
struct string_hash // why isn't std::hash<std::string> this exact same thing?
{
    using hash_type = std::hash<std::string_view>;

    // don't forget the next line
    // this is what causes the lookup methods of unordered containers
    // to select template keys as opposed to constructing the defined key type
    using is_transparent = void;

    size_t operator()(const char* str) const { return hash_type{}(str); }
    size_t operator()(std::string_view str) const { return hash_type{}(str); }
    size_t operator()(std::string const& str) const { return hash_type{}(str); }
};

std::unordered_set<std::string, string_hash, std::equal_to<>> us;
// just like std::less, std::equal_to<> is transparent
// and std::equal_to<std::string> isn't... d'oh!

auto sf = us.find("one ring to bring them all"); // finally, no string here
sf = us.find("and in darkness bind them"_sv); // and no string here

// i would also give and example with std::unordered_map here, but this
// excessive verbosity is gettin on my nerves
```

Right... so, yeah, not great, but finally, not terrible.

## Some Neat Tricks

By the way, transparent lookups (once you remember to make use of them) are actually pretty neat. They can be more than just a means of making lookups by types which are equivalent to the key.

For example, if you often have to search for the same string in several unordered containers, you might want to invest in a fat string: a pair of a string and its hash. Thus you won't have to hash the same thing over and over again in your multiple lookups.

Another pretty cool example is with the ordered containers. I don't ofen use maps or sets (and if I do, most times they are [flat](https://github.com/iboB/itlib/blob/master/include/itlib/flat_set.hpp)), but when order is needed, ranges are a common use case. Many algorithms with a map or a set will start like this:

```c++
void do_something_in_range(const key& rangeBegin, const key& rangeEnd) {
    auto begin = map.lower_bound(rangeBegin);
    auto end = map.upper_bound(rangeEnd);

    // do something from begin to end
}
```

Now this is sub-optimal as two binary searches will need to be made over the entire map. Yes the complexity is O(log *N*), but still, a penny saved is a penny earned. If `begin` and `end` are close, making a single binary search for two elements might be a minor but not-negligible improvement. You may have identified that this is a use case for `equal_range`, but `std::map` and `std::set` don't offer range overloads for it. However with transparent lookups they can:

```c++
template <typename T>
struct ref_range {
    const T& begin;
    const T& end;
    ref_range(const T& b, const T& e) : begin(b), end(e) {}
    friend bool operator<(const ref_range& r, const T& t) {
        return r.end < t;
    }
    friend bool operator<(const T& t, const ref_range& r) {
        return t < r.begin;
    }
};

void do_something_in_range(const key& rangeBegin, const key& rangeEnd) {
    // std::map<key, value, std::less<>>
    auto [begin, end] = map.equal_range(ref_range(rangeBegin, rangeEnd));

    // do something from begin to end
}
```

Yes, it turns out that `map/set::equal_range` are not obliged to return a range of length at most 1. They normally do when the key is a single value, but they more or less work like `std::equal_range`. With transparent lookups one can actually simulate the predicate of `std::equal_range` with maps and sets. See a [live demo here](https://godbolt.org/z/TjzY6efc9).

So, yeah. Transparent lookups are a must when the key is a container itself like `std::string`. Sadly they are not the default but I urge you to make use of them. I urge you do ditch `std::map/set` until you are on C++14 and `std::unordered_map/set` until you are on C++20 in favor of saner alternative implementations.

