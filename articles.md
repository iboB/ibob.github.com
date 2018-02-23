---
layout: page
title: Articles
permalink: /articles/
---

A lisf or articles which I have written either prior to starting this blog or to be published somewhere else:

{% assign sorted = site.pages | where: 'article', true | sort: 'date' | reverse %}
{% for p in sorted %}
{{p.date}} :{% if p.bulgarian %} **Bulgarian:**{% endif %} [{{p.title}}]({{p.url}})
{% endfor %}