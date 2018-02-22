---
layout: page
title: Talks
permalink: /talks/
---

Here is a list of the talks that I have given on various meetups and
conferences:

{% for cat in site.data.talks %}
## {{ cat.language }}
{% include talk-list.md talks=cat.talks %}
---
{% endfor %}
