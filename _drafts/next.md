---
layout: post
title: "An Android Workstation Setup"
category: productivity
tags: ['android', 'mobile']

excerpt: The hassle of setting up my Galaxy S23+ to use as a workstation. The problems I faced and their solutions
---

Continuing from my previous post. Here's how I set things up and also some alternatives.

Here's the gist of it short:

* IDE: [vscode.dev](https://vscode.dev/) with tunnel from the dev machine
* SSH Terminal: [ConnectBot](https://connectbot.org/)
* SFTP: [termius](https://termius.com/)
* Browser: Google Chrome + Samsung Internet
* Email: Gmail + [Outlook for Andoird](https://play.google.com/store/apps/details?id=com.microsoft.office.outlook)

> I have a Samsung smartphone. It uses the Samsung-specific app Dex to connect to an external display. It uses the app Samsung Keyboard and the One UI user interface and launcher. While most of the work I did for this setup is applicable to other Android devices, some of it certainly isn't. The topics that are only applicable to Samsung devices are: Display, Keyboard, and, for the most part Fonts.

## Hardware Harmony

I've read that Android phones generally have no issues with external keyboards and mice, so I just used ones that I have. They are wired, but wireless ones (Bluetooth included) shoud also work. My keyboard also has a bunch of multimedia buttons (audio volume, video playback, zoom, etc) and they also worked just fine. There's settings for how to treat additional mouse buttons and I was satisfied with the defaults. In this regard things were pretty much flawless.

For audio I used a Bluetooth headphone set with a mic.

I connected to the Internet via Wi-Fi.

I read that Galaxy S23 supports 4K external displays, and the one I wanted to use was 3440x1440 so I wasn't expecting any issues there.

My monitor is also a hub, so I connected my phone with a Thunderbolt USB-C cable to it. This connection also provided power back to the phone, so it was charging the whole time. I plugged my mouse and keyboard in the monitor.

External hubs are also an option. I tested one that I had and was able to successfully connect a screen via HDMI, headphones and mic with a 3.5 mm jack (which this particular phone doesn't otherwise have), and an ethernet cable for connectivity.

Samsung's Dex offers two ways of connecting to external displays: direct via Thunderbolt or via a local network. All *my* experiments were direct, but during my reserach I saw many cases where people were sucessfully using the network one. This *is* samsung specific and I don't know the options of other Android devices.

I've also read of instances where people sucessfully connected and used gaming hardware, like gamepads and joysticks, with their phones, but I don't have such devices and I haven't tried them myself.

I also tested an external USB flash drive and it worked.

All in all pretty much all hardware that I tried worked flawlessly and without issues. Well, with the exception of the display itself.

## Display Drama

I remind you that Android only supports a single external display. I was prepared for that and it was not the problem.

The problem I had was Samsung-specific with a Samsung-specific solution, so if you're not interested in setting up a Samsung device, you can safely skip this part.

The problem was screen resolution. When I first connected my monitor, it started with a resolution of 1920x1080 (Full HD): stretched and blurry on the screen with native res of 3440x1440.

So I started searching. And what I found certainly earns Samsung some demerits.

I found a fair amount of posts with people having the same problem. In many of them there were responses in the spirit of "What do you mean? It just works for me". At that point I started thinking that I had pulled the short stick in some kind of an A/B test and that there is a chance that the only way to fix this would be waiting for the next One UI or Dex version.

But there was another class of responses to posts describing my issue. Responses like "Open Good Lock and enable high resolutions in MultiStar". And in some of them the OP had responded with "That solves it. Thanks". What? There was nothing called "Good Lock" on my phone. Nothing in the Samsung store. So, I initially dismissed this as non applicable to me. Perhaps it's something for older versions of One UI, I thought.

But as I kept finding more and more of these types of responses and no solution which was applicable to my case, I eventually researched Good Lock. And yes it [is a thing](https://en.wikipedia.org/wiki/Good_Lock). A thing which is not available in my country. Thanks, Samsung. Bulgarians apparently don't deserve to tweak their Galaxy Devices.

## Fonts Fiasco

## Keyboard Conundrum

## Terminal Turmoil

## IDE Delight

## And the Rest...
