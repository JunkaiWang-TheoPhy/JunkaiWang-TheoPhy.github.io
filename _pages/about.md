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
  --home-grad-blue: rgba(52, 152, 219, 0.18);
  --home-grad-gold: rgba(212, 175, 55, 0.18);
  --home-grad-base-1: rgba(248, 249, 250, 0.95);
  --home-grad-base-2: rgba(255, 255, 255, 0.98);
}

html[data-theme="dark"] {
  --home-grad-blue: rgba(14, 161, 197, 0.18);
  --home-grad-gold: rgba(248, 148, 6, 0.14);
  --home-grad-base-1: rgba(39, 41, 46, 0.98);
  --home-grad-base-2: rgba(49, 51, 56, 0.98);
}

body {
  position: relative;
  background-color: var(--global-bg-color);
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(800px 500px at 12% -8%, var(--home-grad-blue), transparent 60%),
    radial-gradient(700px 520px at 88% -18%, var(--home-grad-gold), transparent 55%),
    linear-gradient(180deg, var(--home-grad-base-1), var(--home-grad-base-2));
  background-size: 140% 140%;
  opacity: 0;
  transform: translateY(-10px);
  animation: home-gradient-reveal 1.1s ease-out forwards;
  pointer-events: none;
  z-index: 0;
}

.masthead,
#main,
.page__footer {
  position: relative;
  z-index: 1;
}

@keyframes home-gradient-reveal {
  0% {
    opacity: 0;
    transform: translateY(-10px);
    background-position: 0% 0%;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    background-position: 100% 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  body::before {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>

Welcome to my AcademicPage! 🤓

## About me
I'm a theoretical physics student researching quantum gravity and cosmology. Let's unite to make human science brighter and stride bravely into tomorrow! ✨

## Q&A and writing
I'm most active on Zhihu (China's StackExchange) as a theoretical physics answerer, and I'm one of 70 优秀答主 in physics among 400 million users. Some 代表作 have been translated into English on my blog ([link](...)).

## Motto
> “Alone we can do so little; together we can do so much.” — Helen Keller

## Name and nickname
My first name, "Jun-Kai," means "talented" and "triumph" in Chinese, and my last name "Wang" means "king." Call me "Julian K. Wang" if you'd like! I revere Caesar and Schwinger.
