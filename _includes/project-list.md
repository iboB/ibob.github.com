{% for proj in include.projects %}
### {{ proj.name }}
[GitHub]({{ proj.github }}),
{% if proj.docs %}[Docs]({{ proj.docs }}){% else %}Docs: *{{ proj.docsd }}*{% endif %}
<br/>
{{ proj.desc }}

---
{% endfor %}