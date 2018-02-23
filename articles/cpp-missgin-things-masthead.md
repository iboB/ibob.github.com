---
layout: page
title: The Missing Things in C++
article: true
date: 2007-09-18
---

> Originally published on {{page.date}} in the [Masthead Developer Blog](http://masthead-dev.blogspot.bg/2007/09/missing-things-in-c.html).
>
> Published in Bulgarian on the defunct SourceCore in 2004.

These are a few of the things that we mused would be, if not practical, then at least interesting to have.

`dont` - keyword, doesn't do what's in its block:

```c++
dont {
   cout << "this program is stupid" << endl; //yep, it's not
   remove("win.com"); //definitely don't do this
   crash(); //d'oh
}
```

Possible implementation with standard C++:

```c++
#define dont if(false)
```

---

`that` - keyword, similar to this, a pointer to a random instance of a class:

```c++
void someclass::somemethod()
{
   that->m_var = 10; //someone got a ten, good luck...
}
```

Unfortunately a clean implementation in the current standard is impossible, but can be done intrusively like so:

```c++
template <class T>
class _thatable
{
protected:
   _thatable() { m_thats.push_back(this); }
   ~_thatable() { m_thats.erase(find(m_thats.begin(), m_thats.end(), this)); }
   T* _my_that() {
      return m_thats[rand()%m_thats.size()];
   }
private:
   static vector<T*> m_thats;
};

#define cool_class(x) class x : public _thatable<x>
#define that _my_that()
```

... and used like so:

```c++
cool_class(myclass) , public other_parent
{
...
};
```

---

`#outclude` - preprocessor, removes all declarations that were previously brought in with an `#include`

```c++
#outclude <vector>
//...
vector<int> a; // ERROR
```

Unfortunately, it's impossible to implement with the current standard.

---

`maybe` - keyword, sometimes returns true, sometimes false...

```c++
bool hmm = maybe;
if( hmm )
    cout << "Hello, world" ;
else
    dont { cout << "Hello, world"; }
```
Pretty straightforward to implement:

```c++
struct {
   operator bool () const {
      return rand() % 2;
   }
} maybe;
```

---

`disusing` and `disusing namespace` - removes a symbol or all symbols in a namespace from the current scope.

```c++
disusing namespace std;
string str; // huh?..
```

---

`private_cast` and `protected_cast` - similar to `const_cast`, allows access to otherwise inaccessible sections of a class.

```c++
class x { int b; } a;
private_cast(a).b = 5;
```

`private_cast` is impossible to implement in general. `protected_cast` on the other hand can be implemented in several ways.
