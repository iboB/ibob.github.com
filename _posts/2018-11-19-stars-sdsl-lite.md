---
layout: post
title: "Stars: SDSL - Succinct Data Structure Library 2.0"
category: stars
tags: ['stars', 'data-structures']

excerpt: A powerful and flexible C++11 library implementing succinct data structures
---

This is one of the main reasons I started Projects Stars. I had starred SDSL some years ago because it looks interesting and completely forgotten about it until now. It still looks interesting.

| Summary | |
|---|---|
| Repo     | **SDSL** [simongog/sdsl-lite](https://github.com/simongog/sdsl-lite): Succinct Data Structure Library 2.0 |
| License  | **GPL v3** |
| Language | **C++** |
| Status   | Complete. Several commits in the past year. |
| Links    | Wiki: [simongog/sdsl-lite/wiki](https://github.com/simongog/sdsl-lite/wiki) Paper: [arxiv](https://arxiv.org/pdf/1311.1249v1.pdf)|

## Review

[According to wikipedia](https://en.wikipedia.org/wiki/Succinct_data_structure), a succinct data structure is a data structure which uses an amount of space that is "close" to the information-theoretic lower bound, but (unlike other compressed representations) still allows for efficient query operations.

The Succinct Data Structure Library contains many such data structures. The ones that seem particularly interesting to me are the various integer vectors with different compression strategies.

To be honest, I'm not sure what the applications of this library might be in practice. It seems like a purely academic effort. Still, it sparked my interest and I'm going to read more about succinct data structures and try to estimate their practical value. I must also admit that I do have a small issue with the GPL v3 license, but I know that is to be expected from academia...

Other than that, the code is in C++11. After a brief skim, it looks pretty decent and well documented. The library's docs seem adequate and I do like the style (not typical for academic writing). There are some examples. As a whole it looks like the repo contains the relevant information for people who are interested in this.

So I will definitely go more into this when I have the time. If anyone has already done so, please share you experience and thoughts.

{% include stars-post-footer.md %}
