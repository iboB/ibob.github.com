---
layout: page
title: The Interface to Component Pattern and DynaMix
article: true
date: 2018-04-04
---

> Originally published on {{page.date}} in [ACCU's Overload Journal](https://accu.org/index.php/journals/c78/).

Much of the evolution of modern language design has been in improving static polymorphism through better features for generic and metaprogramming. Popular languages such as Java, C#, and especially C++ have been going through a renaissance of sorts in this regard for the past 10 or so years. On the other hand languages with good metaprogramming support such as D have been enjoying renewed interest and popularity. Newer languages, such as Nim, are being developed where metaprogramming is the central focus. Dynamic polymorphism on the other hand has been left in the background. For C++, the C++11 standard added `std::function` and `std::bind`, but almost no improvements have been added to the language to support dynamic polymorphism in an object-oriented context (`final` and `override` being the minor exceptions to this).

Object oriented programming doesn’t include dynamic polymorphism in its formal definition, but in practice it has come to imply it. In many contexts (such as Java) the inverse is also true. Given the bad publicity OOP has been getting through the years, it is no surprise it has been living as a side note in languages such as C++ which are oriented towards maximal performance and type safety. Indeed many C++ programmers have forgotten, or deliberately chosen to forget, that C++ is, among other things, an object-oriented language.

While some of the criticism of OOP is concerned with performance, most of it is focused on how bad particular implementations (for example Java’s) are at accomplishing certain complex business requirements. It is the opinion of the author that this is not a problem with OOP as a whole. OOP with dynamic polymorphism is often a great way to express business requirements. Highly dynamic languages such as Python, Ruby, JavaScript, and many more, are thriving in fields dominated by business logic. It is no wonder that many pieces of software are implemented with a core in some high-performance language such as C or C++ and business logic modules in a dynamic and more flexible language (lua being an especially popular choice for games, for example).

Besides the support for better OOP features, such an approach has other benefits, like the possibility to “hot-swap” live code while the program is running and in some cases, using their strong DSL-creation mechanisms, to delegate some code to non-programmers. Unfortunately there are drawbacks, too.

The performance is inevitably worse. Even with JIT, save for very few edge cases, interpreted code is slower than compiled and optimized C++. With JIT 2-5 times slower is the rule but in other, JIT-unfriendly edge cases, ten or more times slower is not unexpected. Without JIT some languages perform even worse. For a Ruby program to be hundreds of times slower than its C++ counterpart is a common occurrence.

There needs to be a binding layer between the core and the business logic language. This is a piece of code (often of considerable size) which has no other purpose than to be a language bridge. It adds more complexity to a project and a lot of time needs to be invested in developing and maintaining it.

There is functionality duplication. Even with the best of intentions it’s often highly impractical to call small utility functions through the binding layer. As a result many such functions have an implementation in both the core and the business logic language. Thousands of lines of duplicated functionality is a normal occurrence in such projects, which is often times the source of duplicated bugs.

It is evident that if the aforementioned drawbacks are prohibitive for a project, some kind of new approach is needed for better OOP support in a high-performance language.

Even though developers of libraries in high-performance languages have been largely ignoring OOP functionalities, there are still some efforts in improving them. For C++ the most notable developments gaining popularity recently are polymorphic type-erasure wrappers. These include the somewhat ancient [Boost.TypeErasure](http://www.boost.org/doc/libs/1_65_1/doc/html/boost_typeerasure.html) and the much more modern [Dyno](https://github.com/ldionne/dyno), and Facebook’s [Folly.Poly](https://github.com/facebook/folly/blob/master/folly/docs/Poly.md). They offer major improvements of the vanilla C++ OOP polymorphism. They allow for better separation of interface and implementation. They are non-intrusive (no inheritance needed). They are more extensible since you define interfaces and classes separately. In some cases they can potentially be faster, but in any case they are not slower than virtual functions.

However… they are more or less the same in terms of architecture. There still are interface types and implementation types. They offer great improvements of OOP polymorphism in C++ but they are not much better than Java or C# in terms of how you design the software. They are just not compelling enough to ditch scripting languages.

One of the most popular OOP techniques in dynamic languages is to compose and mutate objects at runtime. Ruby offers a very concise and readable way of accomplishing this, so consider this piece of code &ndash; part of the gameplay code of an imaginary game (gameplay means business logic in game-dev jargon):

```ruby
module FlyingCreature
  def move_to(target)
    puts "#{self.name} flying to #{target.name}"
  end
  def can_move_to?(target)
    true # flying creatures can move anywhere
  end
end

module WalkingCreature
  def move_to(target)
    puts "#{self.name} walking to #{target.name}"
  end
  def can_move_to?(target)
    # walking creatures cannot walk over obstacles
    !self.world.has_obstacles_between?(self.position, target.position)
  end
end

# composing objects

hero = GameObject.new
hero.extend(WalkingCreature)
hero.extend(KeyboardControl) # controlled by keyboard
objects << hero # add to objects

dragon = GameObject.new
dragon.extend(FlyingCreature)
dragon.extend(EnemyAI) # controlled by enemy AI
objects << dragon # add to objects

main_loop_iteration # possibly the hero can't move

# give wings to hero
hero.extend(FlyingCreature) # overrides WalkingCreature's methods
main_loop_iteration # all fly

# mind control dragon
dragon.extend(FriendAI) # overrides EnemyAI's methods
main_loop_iteration # dragon is a friend
```

Those are Ruby mixins. Note that in C++ circles [the term mixin exists](http://www.thinkbottomup.com.au/site/blog/C%20%20_Mixins_-_Reuse_through_inheritance_is_good) and it's used for something similar. It’s a way of composing objects out of building blocks, but at compile time through CRTP. Now with the Interface to Component pattern a similar functionality can be accomplished in C++ and any other language which has at least Java-like OOP support.

The pattern is based on composition over inheritance (much like almost every fix of OOP-specific problems). Here is an annotated C++ implementation using Interface to Component of the same gameplay:

```c++
class Component // base to all components
{
public:
    virtual ~Component() {}
protected:
    friend class GameObject;
    GameObject* const self = nullptr; // pointer to owning object
};

// component interface for movement
class Movement : public Component
{
public:
    virtual void moveTo(const Point& t) = 0;
    virtual bool canMoveTo(const Point& t) const = 0;
};

// component interface for Control
class Control : public Component
{
public:
    virtual const Point& decideTarget() const = 0;
};

// Main object
class GameObject
{
    // component data
    std::unique_ptr<Movement> _movement;
    std::unique_ptr<Control> _control;
    // ... other components

    void addComponent(Component& c) {
        const_cast<GameObject*>(c.self) = this;
    }
public:
    void setMovement(Movement* m) {
        addComponent(*m);
        _movement.reset(m);
    }
    Movement* getMovement() {
        return _movement.get();
    }

    void setControl(Control* c) {
        addComponent(*c);
        _control.reset(c);
    }
    Control* getControl() {
        return _control.get();
    }

    // ...
    // GameObject-specific data
    const Point& position() const;
    const World& world() const;
    const std::string& name() const;
    // ...
};

// component implementations
class WalkingCreature : public Movement
{
public:
    virtual void moveTo(const Point& t) override {
        cout << self->name() << " walking to " << t << "\n";
    }
    virtual bool canMoveTo(const Point& t) const override {
        return !self->world().hasObstaclesBetween(self->position(), t);
    }
};

class FlyingCreature : public Movement
{
    virtual void moveTo(const Point& t) override {
        cout << self->name() << " flying to " << t << "\n";
    }
    virtual bool canMoveTo(const Point& t) const override {
        return true;
    }
};

    // composing objects
    auto hero = new GameObject;
    hero->setMovement(new WalkingCreature);
    hero->setControl(new KeyboardControl);
    objects.emplace_back(hero);

    auto dragon = new GameObject;
    dragon->setMovement(new FlyingCreature);
    dragon->setControl(new EnemyAI);
    objects.emplace_back(dragon);

    mainLoopIteration(); // possibly the hero can't move

    // give hero wings
    hero->setMovement(new FlyingCreature); // overriding WalkingCreature
    mainLoopIteration(); // all characters fly

    // mind-control dragon
    dragon->setControl(new FriendAI); // overriding EnemyAI
    mainLoopIteration(); // the dragon is a friend now
```

Interface to Component is being widely used in pieces of software with complex business logic such as CAD systems, some enterprise software, and games. It is especially popular in mobile games because their target hardware is less powerful than PCs which makes the developers less likely to sacrifice performance for an additional dynamic language. In can be (and often is) combined with the [entity-component-system](https://en.wikipedia.org/wiki/Entity%E2%80%93component%E2%80%93system) pattern so some components are updated in their own systems appropriately, while others serve as polymorphic implementers of object-specific functionalities. It is a pattern which is easy to understand and relatively easy to implement and modify according to specific needs. For example to have multicast support, one only has to make a vector of components from a given interface. Unfortunately Interface to Components comes with its own set of drawbacks.

The object is a coupling focal point. Every component interface needs to be declared inside (or worse, included with naïve implementations like the one from the example above). In C++ frequent changes to components and object structure will change the object class and trigger a recompilation of the entire business logic system in a project. *This will be mitigated once we have modules, but they are not here yet*.

Most notably though, interfaces are limiting. Imagine the following addition to the Ruby example from above:

```ruby
module AfraidOfSnow
  def can_move_to?(target)
    self.world.terrain_at(target) != Terrain::Snow
  end
end

dragon.extend(AfraidOfSnow)
main_loop_iteration # dragon won't fly to snow
```

We added a mixin which overrides one of the methods of the movement interface. There is simply no easy way to accomplish this with Interface to Component. We could inherit from flying creatures but it is not only flying creatures who could be afraid of snow. This override is applicable for every type of movement. We could [try solving this](https://michael-afanasiev.github.io/2016/08/03/Combining-Static-and-Dynamic-Polymorphism-with-C++-Template-Mixins.html) with the aforementioned CRTP mixins, but this will put a lot of code in template classes and lead to horrible compilation times, and even if we fix this with explicit instantiations, we’re left with the problem of having to know what we override. The only solution is to split the interface into “movement method” and “movement availabilty”... until we’re left with a huge code base of single-method interfaces and the burden of having to deal with knowing which to add or remove in different scenarios.

[DynaMix](https://github.com/iboB/dynamix) is a C++ library which solves these problems. Its name means Dynamic Mixins as it is for dynamic polymorphism what CRTP mixins are for static polymorphism. It allows the users to compose and mutate “live” objects at runtime and offers a big amount of additional features which may be needed in the development of the project. It was conceived and developed back in 2007 as a proprietary library in a PC MMORPG project, and it was reimplemented and open-sourced in 2013. It has since been used in several mobile games by different teams and companies.

Here is an annotated implementation of the same gameplay, this time using DynaMix:

```c++
// declare messages
// DynaMix doesn't use class-interfaces. Instead the interface is provided
// through messages, which are declared with macros like this.
// A message is a standalone function which some mixins may implement through
// methods
DYNAMIX_MESSAGE_1(void, moveTo, const Point&, target);
DYNAMIX_CONST_MESSAGE_1(bool, canMoveTo, const Point&, target);

// define some mixin classes
class WalkingCreature
{
public:
    void moveTo(const Point& t) {
        // `dm_this` is a pointer to the owning object much like `self` was in
        // our previous examples.
        // Note that due to the fact that C++ doesn't have unified call
        // syntax, we cannot write code like dm_this->name(). Instead messages
        // are functions where the first argument is the object.
        cout << name(dm_this) << " walking to " << t << "\n";
    }
    bool canMoveTo(const Point& t) const {
        return !world(dm_this).hasObstaclesBetween(position(dm_this), t);
    }
};

class FlyingCreature
{
public:
    void moveTo(const Point& t) {
        cout << name(dm_this) << " flying to " << t << "\n";
    }
    bool canMoveTo(const Point& t) const {
        return true;
    }
};

// define mixins
// The mixin definition macros "tell" the library what mixins there are
// and what messages they implement
DYNAMIX_DEFINE_MIXIN(WalkingCreature, moveTo_msg & canMoveTo_msg);
DYNAMIX_DEFINE_MIXIN(FlyingCreature, moveTo_msg & canMoveTo_msg);

    // compose objects
    auto hero = new dynamix::object;
    dynamix::mutate(hero)
        .add<WalkingCreature>()
        .add<KeyboardControl>();
    objects.emplace_back(hero);

    auto dragon = new dynamix::object;
    dynamix::mutate(dragon)
        .add<FlyingCreature>()
        .add<EnemyAI>();
    objects.emplace_back(dragon);

    mainLoopIteration(); // possibly the hero can't move

    // Replace WalkingCreature with FlyingCreature
    dynamix::mutate(hero)
        .remove<WalkingCreature>()
        .add<FlyingCreature>();
    mainLoopIteration(); // all objects fly

    // Replace EnemyAI with FriendAI
    dynamix::mutate(dragon)
        .remove<EnemyAI>()
        .add<FriendAI>();
    mainLoopIteration(); // the dragon is friendly
```

Now, this seems like a poorer implementation than the one we created for the Interface to Component example. Namely it seems that the user needs to know what mixin is already in the object in order to change the functionality which is already inside. This is just the case for this simple example. Let's move on to the `AfraidOfSnow` feature:

```c++
class AfraidOfSnow
{
public:
    bool canMoveTo(const Point& t) const {
        return world(dm_this).terrainAt(t) != Terrain::Snow;
    }
};

// Here we define the mixin and set a priority to the message.
// This tells the library that when this mixin is added to an object which
// already implements the message with a lower priority (the default being 0)
// this implementation must override the existing one.
DYNAMIX_DEFINE_MIXIN(AfraidOfSnow, priority(1, canMoveTo_msg));

    // overriding FlyingCreature::canMoveTo
    dynamix::mutate(dragon)
        .add<AfraidOfSnow>();
    mainLoopIteration(); // the dragon cannot fly to snow

    // restoring previous functionality
    // A feature which was not availble in the Interface to Component
    // implementation and even not possible with Ruby's mixins
    dynamix::mutate(dragon)
        .remove<AfraidOfSnow>();
    mainLoopIteration(); // the dragon can fly freely again

```

DynaMix is a free and open-source library under the MIT license. Its source can be found [here](https://github.com/iboB/dynamix), and the documentation [here](https://ibob.github.io/dynamix/).

In short, what does the library do? It provides the type `dynamix::object`, an empty bag of sorts, whose instances can be extended by classes (or mixins) which the users have written. Extending the objects with mixins provides them with the functionality of those mixins.

The term "message" is inspired by Smalltak's strict differentiation between a message and a method (although in many OOP languages "message" has fallen out of favor). Basically a message is the interface, while the method is the implementation. The differentiation is important in a late binding context such as the one in DynaMix. As you can see, with the library users can create messages with the message macros. Those macros generate a standalone function with `dynamix::object` as the first argument. They also generate some functions which the library will use to register the message and fill a "virtual table" for the object which implement it. As we said, this is a late binding scenario, so an empty object implements no messages. A runtime error will be triggered if you call a message for an object which doesn't implement it.

The mixins are the building blocks of DynaMix objects. A mixin is a class created by a library user, and registered with the mixin registration macros. Those macros instantiate internal data structures for the library which associate the mixin with the messages it implements so they can be added to the virtual call table of an object when the user adds this mixin to it. When users mutate objects by adding mixins, the library instantiates them internally using their default constructors (custom allocators can be provided for cases where the memory block or constructor call needs to be user defined). Thus an object instance has a collection of unique mixin instances within it. Again, it's composition over inheritance &ndash; the universal tool. Mixin instances are allocated and constructed or deallocated and destroyed when the object is mutated. Thus a mixin instance cannot be shared between object instances.

Each unique combination of mixins creates an internal object type in the library. It holds the virtual call table for this mixin combination. Objects hold a pointer to their type. The message function which is generated by the message macros finds the appropriate method pointer in the call table of the object, then finds the mixin pointer within the object, and performs the call. This (as any dynamic dispatch) requires some dereferencing indirections but it's always *O(1)*. The object types save a lot of memory per object, since typically there are thousands or even millions of objects but tens or hundreds of unique types. They also mean that the order with which you add mixins doesn't matter. Adding `a` and then `b` will produce the same type with the same virtual call table as adding `b` and then `a`. This is a notable difference between DynaMix and the typical Interface to Component implementation, which has its version of a virtual call table per object and the order of mutation matters. In DynaMix determining which method overrides which doesn't happen with the order of mutation but with message priorities.

For more implementation details and a full list of features you can check out the [code](https://github.com/iboB/dynamix) or the [docs](https://ibob.github.io/dynamix/).
