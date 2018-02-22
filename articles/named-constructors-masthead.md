---
layout: page
title: Named Constructors
article: true
date: 2007-09-15
---

> Originally published on {{page.date}} in the [Masthead Developer Blog](http://masthead-dev.blogspot.bg/2007/09/named-constructors.html).
>
> It was written before C++11 and a significant part of it deals with explaining how named constructors are safe to use performance-wise in a C++98 compiler. Of course after C++11 copy elision is part of the standard.

Here is a little trick, that all you old-school C++ programmers might not know. Obviously it's called "Named Constructors".

So, suppose you need to make a 3x3 matrix class for your game-math library. You need it to make affine transformations so you have to make it represent rotation and scaling. So here is some code, that you'll probably write:

```c++
class matrix3x3
{
public:
   //scaling
   matrix3x3(float xscale, float yscale, float zscale);
   matrix3x3(float uniform_scale);

   //rotation
   matrix3x3(const vec3& axis, float angle);
   matrix3x3(float yaw, float pitch, float yaw);

   //other stuff
   //...
};
```
Great. But wait a minute! We have two constructors that take three floats each. Damn!

Obviously constructs like:

```c++
matrix3x3 m(3, 1, 2); //wtf is this? Scaling?
```
...and the pure impossibility of having two constructors with the same signature make this a bad choice.

So, what can you do?
There is an old-school pattern to write external constructors. Like that:

```c++
void matrix_scaling(matrix& out, float xscale ...
void matrix_rotation_yaw_pitch_roll(matrix& out ...
```
That just doesn't look good. Luckily there is a thing called Return Value Optimization, and specifically Named Return Value Optimization or NRVO (try reading that with your mouth full). Basically NRVO is something that allows you to return heavy objects from functions without worying that they'll be copied, which is slow. And game developers don't like slow. They don't even know what slow means. It's either acceptable or not acceptable. Yeah!... Anywho, [this](https://blogs.msdn.microsoft.com/aymans/2005/10/13/named-return-value-optimization-in-visual-c-2005/) is a link to a blog that explains just how cool NRVO is.

And how did we use it to create our named constructors? That's how:

```c++
class matrix3x3
{
public:
   static matrix3x3 scaling(float x, float y, float z)
   {
      matrix3x3 ret;
      //fill ret with appropriate stuff...
      return ret;
   }
   //you get the point...
   //...
   //you really get the point. there is no need for more examples.
};
```
And just look at how neat the code looks with the named constructors.

```c++
matrix3x3 m1 = matrix3x3::scaling(1, 2, 3);
matrix3x3 m2 = matrix3x3::rotation_yaw_pitch_roll(1, 2, 3);
```

Self documenting code at its finest. And no efficiency loss whatsoever.

I should mention that this is a relatively new standart feature and if you use retro compilers (less than vc8 or less than gcc4) you most probably will suffer from efficiency loss. So hurry and get something contemporary.

If you don't want to bother and read the link I posted above and just want to see whether your compiler has NRVO (I keep reading it "nervo" in my head... that's not right), just test this:

```c++
struct nervo //hehe
{
   nervo() : n(23) { cout << "hello world, baby" << endl; }
   nervo(const nervo& s) : n(s.n) { cout << "cloned!!!111one" << endl; }
   ~nervo() { cout << "lights getting dim..." << endl; }
   int n;
};

nervo test()
{
   nervo n;
   return n;
}

...

nervo x = test();
```

If there's no text like the one from the copy-constructor, you're good to go!
