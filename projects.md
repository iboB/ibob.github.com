---
layout: page
title: Projects
permalink: /projects/
---

I have made small contributions in many open source projects in GitHub. This is
the list of the projects for which I'm the principal developer:

{% comment %} Man, liquid is an awful language :( {% endcomment %}
{% capture toc = '' %}
{% for cat in site.data.projects %}, **[{{ cat.category }}](#{{ cat.id }})**'{% endfor %}
{% endcapture %}

Categories: {{ toc | remove_first: ', ' }}

{% for cat in site.data.projects %}
## {{ cat.category }}     {#{{ cat.id }}}
{% include project-list.md projects=cat.projects %}
{% endfor %}
