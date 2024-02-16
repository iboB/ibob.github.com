---
layout: post
title: "Setting up a Workstation on an Android Smartphone"
category: productivity
tags: ['mobile', 'dex']

excerpt: My new workstation where the computer is, in fact a (not rooted) Android smartphone.
---

I'm starting a series of blog posts about how I set up a backend software development workstation on Android. That is, a workstation where the computer is, in fact a (not rooted) Android smartphone. Galaxy S24+ in my case.

It was not an entirely flawless experience and I'll document the issues I faced and how I resolved them.

In the end though, somewhat to my surprise, I think I managed to get a fairly decent setup. To a point even, where I can see myself potentially shelving (or eniterly ditching?) my home computer.

I may be late to the party as people have been posting similar stuff for years now. I've stumbled on posts and videos about using phones for stuff typically done on desktops or laptops, or connecting them to external screens and physical keyboards for business or pleasure since at least 2019. But I haven't actually seen anything about doing actual software development with a smartphone. So here goes.

> I have a Samsung smartphone. It uses the Samsung-specific app Dex to connect to an external display. It uses the app Samsung Keyboard and the One UI user interface and launcher. While most of the work I did for this setup is applicable to other Android devices, some of it certainly isn't. The topics that are only applicable to Samsung phones and tablets are: Screen resolution, Keyboard, and, for the most part Fonts.

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
    * Future

## What?

First and foremost, I use another computer for the actual heavy computational work. This post series is not about setting up compilers or interpreters on Android.

Running everything locally seems quite feasible on a rooted Android device, with Ubuntu Touch, or with other more open Android variants, but powerful as they are, smartphones and tablets, just cannot compare in terms of computational power to even moderately powerful desktops or laptops. If you spend the same amount on a smartphone and a laptop, the laptop would greatly outperform the phone in computational power.

Running everything locally is perhaps an adequate option for intro-level educational work, where the programs you create are small and modest, and tooling is not of the essense. You don't even have to root your device for that. The Google Play Store is full of educational software for programming. If anything, the issue would be finding the best solutions in the myriad of existing options.

So, I use another computer which builds and runs the actual software, but this is also not a setup which relies on VNC or Remote Desktop.

Such solutions exist for Android and they may be adequate for some. My gut feeling tells me that there's going to be network issues if one goes that route, but I have not tested them and my use case does not benefit from them.

I use computers which in most cases have no graphical desktop set up. I use them via SSH. I use many computers: cloud instances (like Azure, EC2, or Lambda Labs) and my personal computer with port forwarding.

The smartphone is this setup a console for the actual software development part. What it does run locally is the terminal, IDE, and browser. Well, of course also all other apps that are otherwise there. Apps for communication: Slack, Zoom, other messengers, email; and for multimedia: music, videos, games, and the rest. I'm not going to go too much into the latter as smartphones excel in communication (literally their purpose) and multimedia, so there was simply no need to do any special setup work there.

## Why?

Call me cheap, or rather, call me frugal, but the main reason is cost. My first observation was that I was spending increasingly more time working on remote machines. For my pesonal projects I do use my own computer, but sadly I don't have that much time for them. No more than several of hours a week. So, I was exploring the possibility to use a modest laptop for personal stuff and rent cloud compute when I need to get serious. With prices of about $1/hour (and without a GPU, considerably less), even I have the luxury of 10 hours a week for personal projects, such a plan would add to roughly $500 dollars a year. And always using the best current hardware at that. A top of the line home computer can cost 10 times that and it will likely be close to obsolete in 10 years. It doesn't add up. Not if you only use it for 10 hours a week or less. It then dawned on me that I have a modest computer in my pocket at all times. And it's not even that modest. The Galaxy S24 has 12 GB of memory, an 8-core 3GHz CPU, and even a decent GPU. This would've been an expensive PC 10 years ago.

Another is, of course, mobility. My phone is with me at all times. It has an internet connection and doesn't even need Wi-Fi. It's definitely not enough to do actual work on, but it will do for something small and urgent. And to do actual work with such a setup, I need a screen, a keyboard, and preferably, a mouse. The configurations, passwords, SSH keys and everything else I need is in my pocket.

That's what acutally prompted me to try this, but I can think of other reasons (not necessarily ones that apply to me, though):

I mentioned running everything locally can be a decent option for educational purposes. And practially everyone has a smartphone these days. It seems to me that making a desktop from their smartphones, can turn out to be a good way of introducing kids and teens to more... well "serious" use of computers. Be it software development, graphical design, or audio/video editing and creation. At a beginner level, all of these activities are very well covered by existing software for handheld devices.

It's only logical not to waste this great computational power by only using it for phone calls, solitaire, and cat videos. &#x1f596;

Also worth mentioning is that given the quality of modern smartphone cameras, with such a setup you get perhaps the best webcam you've ever used.

And, of course, it's cool. "I work on my phone" has a whole new meaning now.

## Limitations

* This setup is only suitable for backend development.
    * It is not suitable for web frontend development (yet?). Chrome's DevTools don't work on Android. To my knowledge Firefox is the only browser which has a developer console on Android. And that's not all. I have not explored the possibility to run a web server locally (not to say that it's impossible, I just don't know). With my setup there is no localhost. You'll have to serve HTTP (and possibly HTTPS) from the remote machine and this seems to make things too complicated for my taste.
    * It is also not suitable for desktop development. Even if you do end-up running VNC or Remote Desktop succesfully, I suspect everything related to animations, framerates, video, and sound will be completely unreliable.
    * Naturally it's not suitable for creating Android applications. It would make the hole thing into a giant chicken-or-egg problem.
* You can't have two displays connected to an Android device. This may change in the future (and I think that it likely will), but in order to work on your phone, you have to be OK to work on a single display.
* Customization options for your desktop experience on Android are pretty much non-existent. This doesn't matter to me, but if you're the type of person who likes to tweak window transitions and use desktop widgets for everything, you're out of luck. Android does have widgets, but on the desktop. Plus, there no "general look and feel" to speak of. It's every app on its own. Changing the wallpaper is basically all you get.
* No Android browser that I know of supports multiple profiles. This *is* a problem for me as I usually use two profiles on Chrome for personal and professional tasks. My solution is not elegant. I just use two browsers: Chrome and the built-in Samsung Internet.
* Chrome extensions don't work on Android. This was *a bit* of a problem for me, but luckily I don't use too much of these. They do work on Firefox and there are extensions for Samsung Internet, but if you're entirely dependent on Chrome extensions, this is not the setup for you.

## Conclusion

That said, after the somewhat unpleasant experirence to set up everything, it just worked. There was no long adjustment period in order for me to start doing things efficiently. I had no crashes or freezes, or even stutters. I managed to do a full work day on my phone connected to a screen, keyboard, and mouse with pretty much no issues. For science!

Now, on to the details...
