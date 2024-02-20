---
layout: post
title: "A Setup For Backend Development on an Android Phone"
category: productivity
tags: ['android', 'mobile']

excerpt: The hassle of setting up my Galaxy S23+ to use as a workstation. The problems I faced and their solutions
---

Continuing from my previous post. Here's how I set things up and also some alternatives.

Here's the gist of it short:

* The phone is a console
* It runs the IDE and terminal
* ... and browser and existing communication apps
* The actual dev tools are on a remote machine (or multiple machines) used via SSH
* File transfers (if needed) happen via SFTP

> I have a Samsung smartphone. It uses the Samsung-specific app Dex to connect to an external display. It uses the app Samsung Keyboard and the One UI user interface and launcher. While most of the work I did for this setup is applicable to other Android devices, some of it certainly isn't. The topics that are only applicable to Samsung devices are: Display, Keyboard, and, for the most part Fonts.

I wrote this post as a story. If you're not interested in my artistic writing (shame on you), skip [to the end](#TLDR) where I list problems and solutions without the "filler".

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

But as I kept finding more and more of these types of responses and no solution which was applicable to my case, I eventually researched Good Lock. And yes, it [is a thing](https://en.wikipedia.org/wiki/Good_Lock). A thing which apparently started as a lock screen tweaker, hence the name. Also a thing which is not available in my country. Thanks, Samsung. Bulgarians apparently don't deserve to tweak their Galaxy Devices.

I was quite annoyed to find myself on the B-team of the A/B testing once again, but if anything, I was even more determined to get this to work so I went on. I briefly considered a road trip to Greece, but the weather was not that good. I knew however what needed to be done... roughly, so I searched for Good Lock alternatives. And it turns out there's lots of those. Surprizingly many, actually, given that this is something which I expected to be, well, very Samsung-specific. The explanation here was simple and discouraging. Good Lock is a downloader and launcher of various sub-applications which do the actual tweaks (and most of which named &lt;"something"&gt;Star for some reason). Good Lock is basically nothing on its own.

OK. So I need the MultiStar sub-app for Good Lock. Is there an alternative for this? Nope, there is not. Road trip to Greece? Too cold. But wait a minute... Why are there so many Good Lock alaternatives? Is it so bad that you would need one? As it turns out no. It's just that, surprise, surprise, people in Ireland and Japan also want to tweak their Samsung phones. So they use alternatives to Good Lock with alternative ways of getting WhateverStars.

## Fonts Fiasco

## Keyboard Conundrum

## Terminal Turmoil

## IDE Delight

## And the Rest...

## TLDR

* Hardware:
    * Anything should work. You might want to check the max resolutions supported by your device.
    * Consider using a monitor which supports Thunderbolt via USB-C and is also a USB hub. That would make things simpler.
    * Otherwise find a USB-C hub with HDMI, which also supports charging
    * ... or use a network display
* Screen resolution is bad (I only have Samsung Dex-specific solutions here):
    * Install Good Lock from Samsung App Store, install MultiStar
        * If you don't see Good Lock in the app store, it's likely not available in your country, so:
        * Travel to a country where it is, maybe?
        * But, more practically, install [Fine Lock](https://finelock.app/), download an [apk for MultiStar from APKMirror](https://www.apkmirror.com/?post_type=app_release&searchtype=apk&s=com.samsung.android.multistar) and install it manually
    * In MultiStar open "I &#x2661; Samsung Dex"
    * Enable high resolution displays
    * While you're at it, enable "Run many apps at the same time"
* Fonts are not monospace where they should be (terminal and other apps which show code):
    * Change your system font to Default or Roboto (this may be the same thing).
    * Never customize your system font again &#x1F622;
* Phone blinks or behaves weirdly while typing:
    * You have likely installed an alternative onscreen keyboard (like Microsoft SwiftKey)
    * Most of these don't work well in desktop mode. The system one does
    * While in desktop/Dex mode change the keyboard to the system default (Samsung Keyboard)
    * Exit desktop mode and in phone mode change the default again to your favorite one
    * Desktop selection will be remembered
* Terminal app: Use [ConnectBot](https://connectbot.org/). It has the best integration with physical keyboards
* SFTP: [termius](https://termius.com/). It works.
* IDE: [vscode.dev](https://vscode.dev/) with [tunnel](https://code.visualstudio.com/docs/remote/tunnels) from the dev machine
