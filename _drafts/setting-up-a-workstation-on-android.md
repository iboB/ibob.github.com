---
layout: post
title: "Setting up a Workstation on an Android Smartphone"
category: productivity
tags: ['mobile', 'dex']

excerpt: My new workstation where the computer is, in fact a (not rooted) Android smartphone.
---

I'm starting a series of blog posts about how I set up a software development workstation on Android. That is, a workstation where the computer is, in fact a (not rooted) Android smartphone. Galaxy S24+ in my case.

It was not an entirely flawless experience and I'll document the issues I faced and how I resolved them.

In the end though, somewhat to my surprise, I think I managed to get a fairly decent setup. To a point even, where I can see myself potentially shelving (or eniterly ditching?) my home computer.

> I have a Samsung smartphone. It uses the Samsung-specific app Dex to connect to an external display. It uses the app Samsung Keyboard and the One UI user interface and launcher. While some of the work I did for this setup is applicable to other Android devices, some certainly isn't. The topics that are only applicable to Samsung phones and tablets are: Screen resolution, Keyboard, and, for the most part Fonts.

## Index

*I'll be updating this section as I write new posts from the series*

* This post: Intro. Index. What? Why? Limitations
* Future posts:
    * Hardware
    * Screen resolution
    * Keyboard
    * Fonts. Yes, sadly this deserves an entry.
    * Terminal and SSH
    * File transfer
    * IDE
    * Browser accounts and other minor quirks
    * Future

## What?

First and foremost, I use another computer for the actual heavy computational work. This series is not about setting up compilers or interpreters on Android.

Running entirely local seems quite feasible on a rooted Android device, with Ubuntu Touch, or with other, more open, Android variants, but powerful as they are, smartphones, and even tablets, just cannot compare in terms of computational power to even moderately powerful desktops or laptops.

Running entirely local is perhaps an adequate option for intro-level educational work, where the programs are small and modest, and tooling is not of the essense. You don't event have to root your device for that. The Google Play Store is full of educational software for programming. If anything, the issue would be finding the best solutions in the myriad of existing options.

So, yes, I use another computer which builds and runs the actual software. I use it via SSH. In my particular case I even use many computers: cloud instances (like Azure, EC2, or Lambda Labs) and my personal computer with port forwarding.

The smartphone is a console for the actual software development part. What the smartphone runs is the terminal, IDE, and browser. Well, and of course all other apps that are otherwise there for communication: Slack, Zoom, other messengers, email; and for entertainment: music, videos, games, and the rest. I'm not going to go too much into the latter as smartphones excel in communication (literally their purpose) and entertainment, so there was simply no need to do any special setup work there.

