---
layout: post
title: What We Do at ViewRay
category: programming
tags: ['software']

excerpt: A short writeup about the project I'm working on at ViewRay
---

> This is a biref description of the software that I'm working on at [ViewRay](https://viewray.com/). It's a high-level developer's perspective on what's being done by the Innovation team that I'm a part of. If it generates enough interest, it may lead to a spin-off of a company developer blog.
> The post is co-authored by my friend and colleague [Georgi Gerganov](https://ggerganov.com/). He does some cool stuff, too. Do check out the link to his page.

## A Brief Intro to A3I Development

A3I is the software powering ViewRay's MRIdian system.

## About the MRIdian

The MRIdian is a next generation radiation therapy system.

The goal of radiotherapy is to deliver a prescribed dose of radiation to a target volume in the patient's body, using a medical linear accelerator (LINAC). The targets are determined based on diagnostic scans (such as MRI, CT or PET) taken during the initial planning phase of the treatment process. The outcome of therapy planning is a "treatment plan", which specifies the angles and shapes of the radiation beams to be delivered in multiple treatment fractions.

Conventional radiotherapy deliveries the initial "treatment plan" mostly blindly. This can lead to unwanted effects due to inter- and intra-fraction anatomical changes mainly caused by involuntary movement of organs in the patient's body. Breathing, heartbeat, peristaltics, and other movements may cause the target(s) to move outside of the LINAC's line of sight, which could lead to:

* The target(s) not receiving the full prescribed dose. This makes the treatment less effective.
* A nearby healthy tissue receiving a hazardous amount of radiation. This could cause an organ failure and/or lead to various negative side effects for the patient.

The MRIdian is designed to mitigate such issues by providing MRI-guided treatment.

First, the intended "treatment plan" is adapted online based on most recent patient anatomy captured via a daily high resolution MRI scan. This involves rigid and deformable image registration, automatic contouring of target and organs of interest, computation of the dose that will result if the initial treatment plan would be applied using Monte Carlo simulations, solving several large-scale optimization problems to determine optimum beam arrangement for today's anatomy, collaborative editing of target and organs outlines, tools for efficient evaluation and approval of the adapted treatment plan, etc.

Once the adapted treatment plan is approved for delivery, a real-time MRI feed of 2D images is obtained from the patient's body at the same time as the LINAC treatment is being performed. The radiated target is tracked via sophisticated computer-vision algorithms which determine if it is inside or outside of the beam's path. If the target moves outside of the beam's path, the LINAC is stopped until the target comes back inside. This way the healthy tissue around the target can be efficiently spared and the tumor receives the prescribed does with very high precision. The system also computes on-the-fly the actually delivered radiation dose based on the reported machine parameters and anatomy deformations observed in the real-time MRI feed.

This entire process is controlled by the A3I Software.

## A3I

A3I is composed of multiple components. The most prominent ones are the server and the client.

### Client

The A3I client is an HTML5 application. Currently only Chromium is supported as a platform. We ship an Electron build for customers, but most features and active development are done in a plain Chromium-based browser.

The client is written in TypeScript and powered by React.js and Redux. It is not, however, a conventional run-of-the-mill web app.

It is responsible for the real-time presentation of treatment data to the operators and must allow the configuration of treatment parameters. These involve processing of huge amounts of data, powerful visualizations and diagrams, "live" editing of anatomical structures, and many more features. The performance of the client software is very important and special effort is taken in optimizations and writing performant code.

The client makes active use of WebGL, SVG, Canvas, ArrayBuffers, WebSockets, and other HTML5 features which are not ubiquitous in most HTML5 software. Almost every HTML5 feature has its place inside and it truly pushes the browser's limits.

Most of the client code is in-house. We do use npm, but `package.json` is minimal. It depends on React, Redux, Typescript, and some fonts.

The client capabilities are purely involved with presentation. It contains and executes no business logic whatsoever.

Here are a couple of screenshots from the client:

[![manual planning](/blog/a3i-manual-planning-thumb.png)](/blog/a3i-manual-planning.png)
[![manual planning](/blog/a3i-treatment-thumb.png)](/blog/a3i-treatment.png)

### Server

The server is responsible for the heavy-duty data processing and algorithms involved during the treatment process.
It receives commands from the connected clients and sends back all the necessary information needed to render the current UI state.

The server is written in C++17 and a transition to C++20 is in progress, though it is not the main focus right now.

The C++ code includes low-level threading and synchronization, immutable object management, introspection utilities, serialization, and business logic.

The supported platforms for the server are Linux, Windows, and macOS. The MRIdian uses a conventional (though quite powerful) computer which runs Ubuntu. Additionally, we support setups for training and demonstration purposes on the other major operating systems.

The server is a single-process multi-threaded application and is composed of multiple layers and modules.

The "top" layer is the UI Service. It is responsible for the the communication with clients via WebSockets. It deals with type-erased objects which wrap server data from the other layers. The clients subscribe to UI Objects and the server sends and updates them when necessary. The UI service is also responsible for user logins and authorization of user actions.

The "middle" layer is composed of the Workflow Services. They are responsible for handling business logic via state trees of immutable objects, not unlike the state of a React/Redux HTML5 application. An immutable object state is updated via atomic transitions triggered by actions. Accessing the state can be done from any thread in a lockless manner. A workflow service communicates with the bottom layer, with external hardware, and with the database as necessary and combines all relevant data in its immutable state according to the business logic specs. An example for a workflow service is the Treatment Service which handles the ongoing treatment of a patient.

The "bottom" layer are the algorithms. It's where all heavy-duty data processing happens. This includes image processing, plan optimizations, dose predictions, detection of anatomical features, gating decisions, and much more.

The server is also responsible for other, more mundane features, like management of users, patients, treatment calendars and such. For these activities we support communication with external hospital information systems.

### Other components

A3I includes several more components. Some of the more significant ones are:

* Simulators for the external hardware. They are used in development and demo setups.
* A significant number of unit and integration tests including complete software tests and fuzzing driven by browser-automation with Puppeteer. The coverage is around 70% and work is constantly being done to improve it.
* Developer tools for managing and configuring the software. Most of them are written in C++, and there are some written in Ruby, Python, bash, and batch.

## Working on A3I

A3I is a monorepo. It includes the entire code written for the project: client, server, simulators, tests, and tools. Server development is being done on Windows and Linux. Client development is also done on macOS. There is no required setup besides git. The supported C++ compilers include msvc, gcc, and clang. Some developers use Visual Studio, some use VS Code, some use vim.

The code is hosted on GitHub and GitHub is also used for project management. GitHub issues, PRs and code reviews, projects, wikis, and actions are actively used. Besides that, in-house machines run Jenkins-powered builds and tests, host dashboards, dev databases, simulator databases, and other project-related services.

The build is driven by CMake and our custom CMake library for monorepo management. Development-only client builds are done with `npm` and the `$ npm start` workflow is supported.

### The A3I Stack

Here is a summary of the most prominent items of the A3I stack:

* git with GitHub
* C++17 with gcc, clang, and msvc
* TypeScript with npm
* CMake
* React.js
* Electron
* WebSockets
* WebGL and GLSL
* SVG
* Python
* Jenkins
* Ruby

## The Future

There's a lot of work to be done in the future. The most important goal is to implement the treatment planning workflow.

Besides that there's much RnD to be done to bring fully-automated anatomical structure recognition, aid in diagnoses and prescriptions and work towards more and more computer-aided automation for cancer treatment.

