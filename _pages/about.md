---
permalink: /
title: "Academic Pages is a ready-to-fork GitHub Pages template for academic personal websites"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

<style>
:root {
  --home-accent: #d4af37;
  --home-accent-2: #3498db;
  --home-ink: #2c3e50;
  --home-muted: #495057;
  --home-surface: #f8f9fa;
  --home-border: #e9ecef;
}

.home-animated {
  position: relative;
}

.home-gradient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(900px 500px at 10% -10%, rgba(52, 152, 219, 0.18), transparent 60%),
    radial-gradient(800px 520px at 90% -20%, rgba(212, 175, 55, 0.18), transparent 55%),
    linear-gradient(180deg, rgba(248, 249, 250, 0.96), rgba(255, 255, 255, 0.98));
  background-size: 140% 140%;
  opacity: 0;
  animation: home-gradient-reveal 1.2s ease-out forwards;
  pointer-events: none;
  z-index: 0;
}

@keyframes home-gradient-reveal {
  0% {
    opacity: 0;
    transform: translateY(-12px);
    background-position: 0% 0%;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    background-position: 100% 100%;
  }
}

.home-container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.home-hero {
  background: #fff;
  border: 1px solid var(--home-border);
  border-left: 4px solid var(--home-accent);
  border-radius: 10px;
  padding: 2rem 2.2rem;
  margin: 1.5rem 0 2rem;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.home-hero:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.home-kicker {
  margin: 0 0 0.4rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--home-accent);
  font-weight: 700;
}

.home-hero h2 {
  margin: 0 0 0.8rem;
  color: var(--home-ink);
}

.home-hero p:not(.home-kicker) {
  color: var(--home-muted);
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0 0 1rem;
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1rem;
}

.home-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: var(--home-ink);
  color: #fff;
  padding: 0.6rem 1.1rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid var(--home-ink);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.home-button:hover {
  background: var(--home-accent-2);
  border-color: var(--home-accent-2);
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(52, 152, 219, 0.25);
}

.home-button--ghost {
  background: #fff;
  color: var(--home-ink);
}

.home-card {
  background: #fff;
  border: 1px solid var(--home-border);
  border-left: 4px solid var(--home-accent);
  border-radius: 10px;
  padding: 1.6rem 1.8rem;
  margin: 1.4rem 0;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.home-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.home-card h2 {
  margin: 0 0 0.8rem;
  color: var(--home-ink);
  border-bottom: 2px solid var(--home-accent);
  padding-bottom: 0.4rem;
}

.home-card h3 {
  margin: 1.2rem 0 0.6rem;
  color: var(--home-ink);
}

.home-card p {
  color: var(--home-muted);
  line-height: 1.7;
}

.home-card ul,
.home-card ol {
  margin: 0.6rem 0 0;
  padding-left: 1.2rem;
}

.home-card li {
  margin-bottom: 0.5rem;
  color: var(--home-muted);
}

.home-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: #fff;
  border: 1px solid var(--home-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.home-table th {
  background: var(--home-ink);
  color: #fff;
  padding: 0.9rem 0.8rem;
  text-align: left;
  font-weight: 600;
}

.home-table td {
  padding: 0.9rem 0.8rem;
  border-bottom: 1px solid var(--home-border);
  transition: background-color 0.2s ease;
}

.home-table tr:last-child td {
  border-bottom: none;
}

.home-table tr:hover td {
  background: var(--home-surface);
}

.home-table a {
  color: var(--home-accent-2);
  text-decoration: none;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.home-table a:hover {
  background: var(--home-accent-2);
  color: #fff;
}

.js .home-animated .fade-in {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.home-animated .fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .home-container {
    padding: 0 14px 32px;
  }

  .home-hero,
  .home-card {
    padding: 1.2rem;
  }

  .home-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .home-button {
    width: 100%;
  }

  .home-table th,
  .home-table td {
    padding: 0.7rem 0.6rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-gradient {
    animation: none;
    opacity: 1;
  }

  .home-animated .fade-in {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .home-hero,
  .home-card,
  .home-button {
    transition: none;
    transform: none;
  }
}
</style>

<div class="home-animated">
  <div class="home-gradient" aria-hidden="true"></div>
  <div class="home-container">
    <section class="home-hero fade-in" markdown="1">
<p class="home-kicker">Academic Pages</p>
## Build a personal academic website in minutes

Welcome to my playground! 🤓

I'm most active on Zhihu (China's StackExchange), answering theoretical physics questions. I'm one of 70 优秀答主 in physics among 400 million users. Some of my 代表作 have been translated into English on my blog ([link](...)).

I'm a theoretical physics student researching quantum gravity and cosmology. Let's make science brighter and stride into tomorrow together! ✨

> “Alone we can do so little; together we can do so much.” — Helen Keller

**How to remember me:** My first name, “Jun‑Kai,” means “talented” and “triumph” in Chinese, and my last name “Wang” means “king.” Call me “Julian K. Wang” if you'd like! I revere Caesar and Schwinger.



  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const tableRows = document.querySelectorAll('.home-table tbody tr');
  tableRows.forEach((row, index) => {
    row.classList.add('fade-in');
    row.style.transitionDelay = `${index * 0.05}s`;
  });

  const fadeElements = document.querySelectorAll('.home-animated .fade-in');
  if (!('IntersectionObserver' in window)) {
    fadeElements.forEach((element) => element.classList.add('visible'));
    return;
  }

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  fadeElements.forEach(element => fadeObserver.observe(element));
});
</script>
