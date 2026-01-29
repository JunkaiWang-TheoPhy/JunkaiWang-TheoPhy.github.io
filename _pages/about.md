---
permalink: /
title: "PSI Start"
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

Welcome to my AcademicPage! 🤓 Now it's my Online CV.


## Motto
Man must live it so as to feel no torturing regrets for wasted years, never know the burning shame of a mean and petty past; so live that, dying, he might say: all my life, all my strength were given to the finest cause in all the humanity —— the fight for the (Intellectual) Liberation of Mankind.

—— Nikolai Ostrovsky, *How the Steel Was Tempered*.

## About me
I'm a theoretical physics student researching fundamental aspects of our universe. I am deeply passionate about theoretical physics, and out of passion for research, I continued to pursue scholarly study as a visiting scholar after completing my undergraduate degree, and now I believe I am qualified to be a   graduate candidate in theoretical physics.

Let's unite to make human science brighter and stride bravely into tomorrow! ✨

## How to know me better!
I'm most active on Zhihu (China's StackExchange & Quora) as a theoretical physics answerer, and I'm one of 70 "Top Answerers in physics" among 420,000,000 users. I‘ve gained 50k+ favorates, 46k+ agrees, 16k+ followers, and 12k+ shares. 300+ blogs & answers have been published, covering various topics in theoretical physics, thus helping thousands of young physics students and even faculty members in China.


It's kind of scientifc outreach. Because of my distinctive undergraduate experience of lacking tutorial guidance and collegues, I believe that **nurturing young scholars is just as important as doing scientific research**, so I am always eager to share my insights and knowledge. 



## How to memorize me?
My first name, "Jun-Kai," means "talented" and "triumph" in Chinese, and my last name "Wang" means "king".

Call me "Julian K. Wang" if you'd like!😉 I revere Caesar and Schwinger.

## What am I interested in now?
Up to now, I'm mostly interested in the following topics:

- Quantum Matter
  - Intersection between new frontiers of quantum gravity, quantum information, symmetries, and numerical methods
  - mixed states; strong symmetries; strong-to-weak SSB; AdS/CFT; low-dimensional quantum gravity
  - tensor networks; quantum chaos; quantum complexity; matrix models; low-dimensional holography; SYK; DSSYK
  - generalized symmetries across quantum gravity / quantum matter / CFTs
  - strongly correlated systems; fuzzy-sphere; sphere-based diagnostics; 3D CFT / criticality
- Quantum Gravity
  - low-dimensional gravity; entanglement; complexity; observers
  - JT; DSSYK; de Sitter-like settings
  - 3D gravity; LQG; TQFT; AdS/RMT; 2D gravity (JT)
  - dynamical dark energy; swampland
  - entanglement in scattering amplitudes / observables
  - quantum–classical distinction; post-quantum classical gravity
  - observers and algebras; quantum reference frames
- Quantum Information
  - Quantum Artificial Intelligence; HEP & CMP Theoretical Physics intersection
  - Quantum Automated Learning
  - Quantum for AI; Quantum Machine Learning
  - holographic quantum information
- AI for Fundamental Science
  - Physics for AI; AI for Physics; Physics of AI
  - scaling laws; complexity; entanglement
  - scientific agents; neural networks for HEP/CMP models
  - physical principles underlying LLMs
