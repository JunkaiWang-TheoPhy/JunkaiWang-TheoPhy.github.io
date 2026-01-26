---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education Experience
======
* Tsinghua University - Sep 2024 - Present
  * Visiting Scholar
  * Co-advised by Quantum Information Group and Mathematical Physics Group
* University of California, Santa Barbara - Jun 2023 - Aug 2023
  * Visiting Student in summer
  * In High Energy Theory Group
* University of California, Berkeley - Jan 2023 - Jun 2023
  * International Student 
  * Berkeley Physics International Education (BPIE)
* Nanjing University - Sep 2020 - Jul 2024
  * Bachelor in Physics 
  * National Top-notch Student Education Program for Fundamental Sciences (5‰ in students of basic science)

  
  
SKILLS
======
* Languages: Mandarin (native), English (fluent), Japanese (basic)
* Code: Python, Mathematica, Matlab, Lean

Publications
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Talks
======
**Academic Talks**
- **Fudan Student Workshop on Theoretical Physics (in Preparation)** - 2026  
  *On recent progress of generalised symmetries, mixed states, and SSB*  
  *On recent progress of Quantizing 3d Gravity and its relation with LQG and TQFT*  
  Fudan University
- **3rd SUSTech Mathematical Physics Workshop** - 2025  
  *An Introduction to String Phenomenology and Recent Progress in the Swampland Program*  
  Southern University of Science and Technology (SUSTech)
- **25th Corfu Summer Institute 2025 - Workshop on Quantum Gravity and Strings** - 2025  
  *Quantum Gravity Meets DESI: Dynamical Dark Energy in Light of Swampland Trans-Planckian Censorship Conjecture*  
  European Institute for Sciences and their Applications (EISA)
- **25th Corfu Summer Institute 2025 - Tensions in Cosmology** - 2025  
  *Quantum Gravity Meets DESI: Dynamical Dark Energy in Light of Swampland Trans-Planckian Censorship Conjecture*  
  European Institute for Sciences and their Applications (EISA)
- **International Symposium on Cosmology and Particle Astrophysics (CosPA 2025)** - 2025  
  *Quantum Gravity Meets DESI: Dynamical Dark Energy in Light of Swampland Trans-Planckian Censorship Conjecture*  
  Institute for Basic Science (IBS) & Korea Institute for Advanced Study (KIAS)
- **2nd SUSTech Mathematical Physics Workshop** - 2024  
  *(1) Recent Developments in Black Hole Thermodynamics and the Information Paradox*  
  *(2) The Art of Estimation and Dimensional Analysis in Zee's _Fly by Night Physics_*  
  Southern University of Science and Technology (SUSTech)
- **Quantum Many-Body Grain Pecking Seminar Seminar** - 2023  
  *A Comparative Study of Quantum Field Theory Mathematics in Condensed Matter Physics and High-Energy Physics*  
  Online seminar
- **1st SUSTech Mathematical Physics Workshop** - 2023  
  *Monopoles in Classical Field Theory, Supersymmetric Field Theory, and Topological Defect Theory*  
  Southern University of Science and Technology (SUSTech)
- **Workshop on Algebraic Quantum Gravity** - 2023  
  *Algebraic Quantum Field Theory and Its Applications to Quantum Gravity*  
  Institute of Philosophy, Chinese Academy of Sciences
- **5th National Symposium on Philosophy of Physics** - 2021  
  *Form & Function: A Linguistic-Semiotic Investigation on Modern Physics*  
  University of Science and Technology of China
  
Conference Attending
======
<ul>{% for post in site.conference_attending reversed %}
  <li>
    {{ post.title }}{% if post.location %} — {{ post.location }}{% endif %}{% if post.date %} ({{ post.date | date: "%Y" }}){% endif %}
  </li>
{% endfor %}</ul>

Talks on Learning Seminar
======
- **AdS/CFT Reading Seminar** — 2024–2026  
  Peking University

- **Black Hole Learning Seminar** — 2024–2025  
  Tsinghua University & Yanqi Lake Beijing Institute of Mathematical Sciences and Applications (BIMSA)

- **Lie Group & Lie Algebra Learning Seminar** — 2024–2024  
  Yau Center, Southeast University

- **General Relativity Learning Seminar** — 2023–2024  
  Yau Center, Southeast University
  
Leadership
======
{% assign leadership_sections = "Organizer Experience|Leadership and Activities|Social Engagement" | split: "|" %}
{% for section in leadership_sections %}
**{{ section }}**
<ul>
  {% assign items = site.activities | where: "category", section | sort: "order" %}
  {% for item in items %}
    <li>
      <a href="{{ base_path }}{{ item.url }}">{{ item.title }}</a>{% if item.organization %} — {{ item.organization }}{% endif %}{% if item.role %} — {{ item.role }}{% endif %}{% if item.dates %} ({{ item.dates }}){% endif %}
    </li>
  {% endfor %}
</ul>
{% endfor %}
