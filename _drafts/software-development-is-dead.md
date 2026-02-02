---
layout: post
title: Software Development is Dead
category: programming
tags: ['ai', 'rants']

excerpt: ... but "unix-ification" and "software double buffering" are apparently alive
---

Definitely my clickbait-iest title so far. But... it fits. It's true.

In the near future the number of humans doing software development profesionally will drop a thousandfold. Likely more.

Yes, of course, because of AI.

And think this will happen even if the capabilites of foundation models don't change significantly from where they are now.

Ok, ok. It is *actually* just my opinion, but as open-minded as I am, I fail to find evidence of the contrary.

And, yes, I know saying this puts me square in a group with a bunch of peoople who wear tinfoil hats and fear glowies, and whole lot of people who have little idea of what software development really is. I however have almost 25 years of experience as a software engineer. I think I have some convincing arguments to back my claim up. So, please, don't be blinded by the shinines of my headgear, and hear me out.

First and foremost, I'm not saying sofware developers will get replaced by AI doing their jobs (DEY TOOK AR JERBS!). I do *not* think the future is essentially the same software shops creating more or less the same software, but instead of humans, it's AI agents doing the work.

I am also familiar with the Jevons Paradox and I completely agree that the quantity of newly created software will greatly surpass what we have now.

I think we're headed for a fundamental shift in computer use.

## Premise

I started forming this opinion around the second half of 2024. In these ancient times there was no vibe coding, there were no agents. Reasoning models were probably a thing in labs, but they definitely weren't accessible to consumers. Pracitcal AI-generated code was basically glorified autocomplete. It was clear even back then, however, that there is a very strong movement, instentive, and effort towards AI driven software development. So, I thought, what if we *do* do it? What if we manage to create a decent AI software engineer? What if it's really cheap to run it?

And I think we did do it. Right now[^1], we have decent... not great, not perfect, not as capable as the best humans, but decent AI software engineers. We've had them for at several months, now. And it's not just a software engineer. AI agents are pretty decent in using computers as a whole. They do a fine job in DevOps, automation, data processing, and practically anything one can do in a terminal. So, that is most activities involving a computer.

Next comes the deflation of token prices, which I find likely to remain sustained. I know many people are saying that current inference costs are covered by "burning venture capital", but hyperscalers keep... well... hyperscaling. Developing datacenters and new power generation capabilities is in the works basically throughout the world.

So that's my premise is this: AI makes for a decent software engineer and it's only gonna get cheaper.

If these things are not true, we're "saved"[^2]. But even if you don't believe them to be true right now, like I do, imagine that they might become true. Imagine what will happen then.

## The Gist of the Software Industry

Creating software is labor intensive. We want to preserve the fruits of our labor as much as possible. Theory *and* practice have always revolved around that. DRY, loose coupling, OOP, components, libraries, frameworks, standards, conventions, specifications, programming languages... a significant part of the industry has been focused on solutions to the problems of abstraction, reusability, and interoperability, rather than directly fulfilling end user requirements or needs.

The end user wants us to ship and ship fast, but of course in order to do so, we, as engineers, as humans, have to lay the groundwork to make it possible. We invest in these meta-solutions to the point where enitre sub-industries exist whose sole job is developing just them. Then software architects combine meta-solutions into a pipeline for creating end user software.

But it is ultimately the end user that's important, right? That's where the money comes from. That's why we can afford investments of billions, trillions even, into meta-solutions.

## More Power to End Users

End users will gradually start building software. Many already have. Many more will. Yes, it's "bad" software. It's built by AI agents, decent mid-level engineers, and not us all knowing greybeards. It's not optimal. It's ugly. It's spaghetti. It has plenty of bugs and security issues. But it gets the job done. It's software that wouldn't have otherwise existed. We may laugh at the spectacular failures of some of these attempts that went too far too fast, but behind all of them are a myriad of success stories.

But that's not the end game. What I've just described is precisely the thing that I "first and foremost" wasn't going propose.

It implies non-software-developers will create the same software that yes-software-developers currently create. I'm not the first one to point out that this model is not sustainable. Not unless there's a dramatic shift in model capabilities, which I also said I'm not relying on.

It's a natural first phase, though. People try to replicate what they are accustomed to. "I want to do X, Y, and Z. It's natural for me to imagine and try to create an XYZ system. I know of existing XYZ systems. They are a thing".

And yes, the problem here is than an "XYZ system" is complex software. It has to consolidate these pesky Xs, Ys, and Zs. Provide interfaces to enter them, edit them, query them. It has to handle their invariants. Store them in a database. Just as a human will have a hard time designing this software, an LLM would too. It has to design the appropriate data structures in some programming language. It has to deal with abstractions that can fit its context, devise installation and integration strategies, handle and propagate errors... all the jazz. AI is worse than experiensed and competent humans at these tasks[^3].

Yes grandma will have her buggy home finance app, but it can't power an accounting firm. The risks of bad software far outweigh the benefits of cheap software when the stakes are this high. As many have pointed out, with just that the software industry is not really in danger.

I am with the critics so far. End users can't build software like we do. If it would stop at that.

## Unix-ifying Software To Fit Intent

The design philosophy of Unix, which made its way into Linux and other operating systems like FreeBSD and then macOS, is great. A bunch of small independent programs communicate through abstract pipes. Each program can well "fit into the context" of a human developer. Each can be worked on in isolation. Problems in one may affect some others, but usually not the entire system. Only a subset of them can be available on a system. It's microservices before microservices were cool.

Separation of concerns, loose coupling, discrete subsystems. We find this in every software. I've never seen the source code of Photoshop, but I will bet good money that the code for the lasso selection tool is not interwoven with the code for rasterizing fonts.

What we don't find in every software is independent programs. It is a good way to build an operating system where there is no task-specific context. There is no concrete job to be done. It has to support users who watch TikTok videos all day *and* users who run simulations that push the fronteer of astropysics. And TikTok, and Astrophysics Fronteer Pusher&trade;, and Photoshop do have a task-specific context. They support much more specific workflows (and funflows?) and must provide a user interface with which the user can "tell" the computer what to do. These types of software have a protocol by which user intent is sent from the user interface to the backend and a protocol by which the result is sent back. They need design to allow the user express their intent and accomplish tasks.

Translating the user's intent into the protocol for subsystem communication and devising the data structures to carry that intent and the ones to carry the result back is the job of the software designers and engineers.

`$ photoshop foo.png | select-object --coord 123;125 --threshold 0.3 | fill-pixels | gradient --linear --color=green --direction=1,0`

It is technically possible to make Photoshop work like that. It would have an incredibly steep learning curve, yes, but this is almost ImageMagick, and people do use ImageMagick. That's not the most iportant thing here. It's the protocol I mentioned above. All of these programs need a protocol to exchange the information. It's just that the protocol Photoshop has chosen is shared memory within a single process. Internally the dataflow is likely very similar. It would be impractical to design Photoshop by employing descrete programs for each task. The separation of concerns exists, but it's internal, in a big software monolith.

While it's doubtful that an AI agentic process will have a big success in replicating Photoshop, AI agents are completely capable of developing each of these programs.

When designing software systems, we focus on allowing users to express their intent. Intent is hard to process. Complex systems allow users to configure or otherwise  augment the ways they express their intent until the all [contain an ad hoc, informally-specified, bug-ridden, slow implementation of half of Common Lisp](https://en.wikipedia.org/wiki/Greenspun%27s_tenth_rule). And that's precisely where LLMs shine. LLMs are the ultimate pipe. Yes, Photoshop could have a tool to select an object at cursor's position and fill it with a green gradient, but we all laugh at how specific this is. The user wants to soo how their house would look with a green door. And we *all* know what it's not Photoshop, but a certain nano-scale elongated yellow fruit that people will use to do this nowadays.

So, what LLMs bring to the table is an unparallel way of translating user intent into commands. Why learn the Lasso tool, when you can just type (or say) "select all puppies"? Why even select? Selection is just a means of sudividing intent into manageable subtasks that can fit the protocol. Convert all puppies to dragons! Done.

The steering of intent does not have to come from software designers anymore. Software can't remain the same. This is the fundamental shift of computer use. End users will not be building software. They will only be expressing intent. The future is working with goals and intent directly without complex interfaces and learning curves.

And now let's take a look at a situation, most often discussed in HR circles. A contingent economic condition which is typically very scary for the parties involved, typically employers and employees, and has historically rarely come to be:

## Replacement Is Cheaper Than Retention

I am, however, not applying this to humans. I'm applying it to software. I argue that the world is headed towards *the situation* of this situational cost assymetry.

Once upon a time, in the late 1990s, when I was beginning my first ever experiments with graphics and game development, I was really surprised to learn that it is efficient to render the entire scene into an image and then blit this entire image onto the screen replacing the previously rendered one. I found it really hard to internalize that this is more often than not significantly *more* efficient than trying to keep track of the parts of the screen that are being affected by the current frame, and only replacing those. My first ever snake game was labouriously clearing the tail section of the snakes and replacing the head section, but once I "got" double buffering, I never looked back.

We're about to enter the world of software double buffering.

If we're Unix-ifying software, we still need those independent programs that the AI will use? Yes AI can write them, but AI can't possibly do a good enough job to design them.

I agree. But it doesn't need to. Our old way of thinking about software screams at us that those components, subroutines, or tools are what's valuable. But with software double buffering, it's not. Those subroutines are just artifacts. They are created on the fly, to accomplish a specific task, to translate a specific instance of an intent into a result and then thrown away.

AI agents can create a plan, execute steps, writing a piece of code for each step as needed and then throw away everything. The dataflow design is temporary. Specific to a given task. And even if storage and data integrity is mostly safe from the clutches of the robots for now, I wouldn't be surprized if this changes.

When designing a, say CRM system, you will likely devote some time in designing the database. You will design queries. You may decide whether to have an ORM or which one. But I put forward that if you give a bare database to an agent and prompt "this is a CRM database, create a graph of the conversion of marketing budged to sales in the previous year" it will likely do a decent job. "This was very slow, make such requests faster in the future". This will likely be within the capabilities of most agents.

## The Future

While I am not saying that people who create software for a living will be gone, I think the prospects of this future will dramatically reduce them. Without foundational model improvements a lot of softare development will remain in human teritory: theoretical developments; identifying, fixing, and naturally, exploiting security vulnerabilities; performance critical optimizations of dataflow in databases, networks, video, pehaps many more concrete tasks. All of which are considered niche these days. That [person in Nebraska](https://xkcd.com/2347/) thanklessly supporting all modern digital infrastructure since 2003 is definitely safe for the foreseable future.

We will likely have things like State Architects, or Data Librarians, or Schema Wizards, but their output, even if private and hidden, is highly scalable. They devise principles rather than implementations.

Stats say that the number of professional software developers in the world is close to 30 million. I put them closer to 100 thousand in ten years. And... considering this relies on foundational models not becoming much better than they are today, maybe this is too optimistic.

So, please, give me your "The reports of my death are greatly exaggerated" takes. I'd love to a better outlook on this. I really would.

____

[^1]: February, 2026
[^2]: ... from my doomsday scenario, at least. Many others exist.
[^3]: Inevitable "so far", here
