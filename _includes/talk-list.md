{% for talk in include.talks %}
**{{ talk.title }}**<br/>
{% if talk.slides %}[Slides]({{ talk.slides }}){% endif %} {% if talk.video %}[Video]({{ talk.video }}){% endif %}<br/>
{{ talk.desc }}
{% endfor %}