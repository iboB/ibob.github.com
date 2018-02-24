---
layout: page
title: Projects
permalink: /projects/
---

I have made small contributions in many open source projects in GitHub. This is
the list of the projects for which I'm the principal developer:

Categories: {% for cat in site.data.projects %}**[{{ cat.category }}](#{{ cat.id }})**, {% endfor %}**[Non-software](#non-soft)**

{% for cat in site.data.projects %}
## {{ cat.category }}     {#{{ cat.id }}}
{% include project-list.md projects=cat.projects %}
{% endfor %}

## Non-software {#non-soft}

{% for proj in site.data.projects-non-soft %}
### {% if proj.url %}[{{proj.name}}]({{proj.url}}){% else %}{{proj.name}}{% endif %}
{{proj.desc}}

---
{% endfor %}
