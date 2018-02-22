---
layout: page
title: Articles
permalink: /articles/
---

{% assign sorted = site.pages | where: 'article', true | sort: 'date' | reverse %}
{% for p in sorted %}
{{p.date}} : [{{p.title}}]({{p.url}})
{% endfor %}