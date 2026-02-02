---
layout: post
title: The End of the User Interface
category: programming
tags: ['ai', 'rants']

excerpt:
---

Definitely my clickbait-iest title so far. But... it fits. It's true.

The user interface as we know it is about to die.

Yes, of course, because of AI.

I think this will happen even if the capabilities of foundation models don't change significantly from where they are now.

## Premise

I started forming this opinion around the second half of 2024. In these ancient times there was no vibe coding, there were no agents. Reasoning models were probably a thing in labs, but they definitely weren't accessible to consumers. Practical AI-generated code was basically glorified autocomplete. It was clear even back then, however, that there is a very strong movement, incentive, and effort towards AI driven software development. So, I thought, what if we *do* do it? What if we manage to create a decent AI software engineer? What if it's really cheap to run it?

And I think we did do it. Right now[^1], we have decent... not great, not perfect, not as capable as the best humans, but decent AI software engineers. We've had them for at least several months now. And they’re not just software engineers. AI agents are pretty decent in using computers as a whole. They do a fine job in DevOps, automation, data processing, and practically anything one can do in a terminal. So, that is most activities involving a computer.

Next comes the deflation of token prices, which I find likely to remain sustained. I know many people are saying that current inference costs are covered by "burning venture capital," but hyperscalers keep... well... hyperscaling. Developing datacenters and new power generation capabilities is in the works basically throughout the world.

So my premise is this: AI makes for a decent computer user and it's only gonna get cheaper.

I'm not going to delve into defending these claims. Both AI boomers and doomers have posted ample material on the subject.

So, what if these claims are true?

## What Is a User Interface?

A user interface (UI) is a means to translate the software user's *intent* into a domain-specific machine-readable *protocol* and, subsequently translating a machine result into a user-readable output.

The first part is an inherently lossy process. The machine-readable protocol can't possibly cover all possible invariants of user intent. That's why we have specialized types of software for types of user intent. They usually limit the intent or artificially subdivide it into elements. These subdivisions of intent are called workflows.

Complex systems allow users to configure or otherwise augment wokrflows until they all [contain an ad hoc, informally-specified, bug-ridden, slow implementation of half of Common Lisp](https://en.wikipedia.org/wiki/Greenspun%27s_tenth_rule).

In a workflow in Photoshop the user might use the lasso tool to select a part of the image, convert the selection into a layer and draw a different image in the place of the selection. The intent however may have been replacing all puppies with dragons.

And you likely see where I'm getting at. If the intent is replacing puppies with dragons in an image, we *all* know that it's not Photoshop, but a certain nano-scale elongated yellow fruit that most people will use these days.

What LLMs bring to the table is an unparalleled way of translating user intent into actions. Why learn the Lasso tool, when you can just type (or say) "select all puppies"? Why even select? Selection is just an artificial subdivision of intent into manageable elements that can fit the protocol.

Historically it was the job software and UI designers to devise these workflows. It was their job to envision types of user intent and develop the workflow and UI so that the intent is best expressed. It was then the job of the users to learn those UI primitives and workflows so that they can translate their intent into results. Both ends meeting each other half the way, of sorts.

____

[^1]: February, 2026
[^3]: Inevitable "so far", here
[^4]: So long, left-pad... again
