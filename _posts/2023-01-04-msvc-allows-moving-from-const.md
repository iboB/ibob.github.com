---
layout: post
title: "MSVC: The Devourer of Const"
category: programming
tags: ['c++', 'msvc', 'rants']

excerpt: A compiler bug allows you to move a const variable as if it isn't const
---

So, there's this apparent MSVC bug which allows you to move out of a `const` variable as if it isn't const with no errors or warnings.

Here's some example code:

```c++
#include <iostream>
#include <string>

template <typename T>
T galactus_the_devourer_of_const(const T& v) {
    return false ? std::move(T{}) : std::move(v);
}

int main() {
    const std::string food = "asdf";
    std::cout << "before: " << food << '\n';
    galactus_the_devourer_of_const(food);
    std::cout << "after:  " << food << '\n';
    return 0;
}
```

[*Live demo here.*](https://godbolt.org/z/zMqv9hWs4)

Even though `food` is `const` it still gets its value "taken".

I first came upon it more than a year ago in September of 2021 and at first it was infuriatingly annoying, but then I noticed that it somehow happened in one of my projects and didn't in another. Then I found out that it only happens with the compiler flag `/permissive`, which is the default, and doesn't with `/permissive-` which is the only sensible option for people even thinking about writing multi-platform C++.

Since all of my projects use `/permissive-` and I only encountered the bug due to an oversight, the severity was scaled down to *a minor nuisance*.

Still, it happens with the default settings on. It's somewhat contrived, but I can imagine someone else getting bitten by it. I [opened an issue](https://developercommunity.visualstudio.com/t/a-const-variable-can-be-moved-losing-its-contents/1540939) on Miscrosoft Developer Community, but (as is tradition) it's just sitting there, stale and unloved.

I hope it doesn't bite *you*.
