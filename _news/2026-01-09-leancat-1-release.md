---
title: "Happy New Year, everyone!"
date: 2026-01-09
---

Happy New Year  everyone! 😉 At the very start of the new year, I’d like to share our recent release **LeanCat-1 (arXiv:2512.24796)**. To the best of our knowledge, this is the **first Lean 4 formal-proof benchmark suite dedicated specifically to category theory**.

**LeanCat** contains **100 statement-level tasks**, covering **8 topic clusters** such as **adjunctions / limits–colimits / abelian categories / monads**, and is designed to pressure-test **“abstract interface-layer reasoning + mathlib navigation (library-mediated reasoning)”**. The baseline results are quite brutal: even the strongest model only reaches **8.25% pass@1 / 12% pass@4**; **Medium/High** are essentially near-zero, directly exposing the **natural-to-formal bottleneck**. We also evaluated **LeanBridge**: a **retrieve–generate–verify loop** that combines **LeanExplore retrieval** with **Lean compilation/verification feedback**, bringing stable improvements on a subset of tasks.

**LeanCat: A Benchmark Suite for Formal Category Theory in Lean (Part I: 1-Categories)**
[https://www.alphaxiv.org/abs/2512.24796](https://www.alphaxiv.org/abs/2512.24796)

**GitHub repository**
[https://github.com/sciencraft/LeanCat](https://github.com/sciencraft/LeanCat)

Since I barely know faculty and peers in **AI for Math**, and know even fewer in **AI for Science**, **any shares and comments would be extremely helpful and very welcome**.

I believe this work has some “bridging” significance for the **AI for Math** and **formal proof** communities. So what follows is mainly a **personal perspective**.

---

During a break after a quantum matter conference this summer, Prof. **Luodi** remarked to us that doing frontier quantum-physics research does not necessarily require being in an academic institute—industry and companies can also provide excellent research environments. Many outstanding researchers at the frontiers of quantum computing and AI hold similar views. Meanwhile, companies often command financial resources far beyond what universities can access.

That sentence has stayed with me ever since. In areas like **AI4S**, why should scientists still work on scientific problems, instead of handing everything over to industry?

In my view, it is because there are certain things that **only scientists will reliably do**. Researchers in academic institutions and commercial decision-makers in big tech operate under different value systems. For instance, in practice, big tech cares a great deal about establishing benchmarks based on competitions like **IMO** and **IPhO**, training AIs to “climb leaderboards,” and then claiming this demonstrates their AI’s scientific literacy and intelligence. But competition problems usually reflect **very mature** scientific knowledge and focus heavily on technique; they help relatively little with **frontier** scientific questions. Why do companies choose competitions as the yardstick for intelligence? There are many reasons: competition scores are directly rankable and easy for investors and the public to accept; and within the AI industry there are many former **IMOers / IOIers**, for whom such problems are naturally familiar.

By contrast, research on real scientific problems requires long-term academic accumulation. A typical scenario is that, when discussing industry–academia collaboration in **AI for Science**, company representatives (e.g., from ByteDance, Huawei, etc.) and physicists can end up not understanding each other’s internal discussions at all. Academic results are often hard to interpret intuitively, and building high-quality datasets is difficult. For these reasons, industry tends to invest less in basic mathematical and physical sciences, and instead prioritizes topics with clear, observable returns: in biopharmaceuticals, for example, optimizing each step in pipelines such as large-molecule DFT can translate into enormous profits; today, Tsinghua University published its first Science paper of the new year titled (in Chinese) “AI enables million-fold acceleration of virtual drug screening.” Similar stories hold for materials, energy, and chemical engineering—rather than basic science, which often appears to have limited immediate economic payoff.

Yet, as **Professor Shing-Tung Yau** has said, *“The foundation of technology is science.”* The most cutting-edge breakthroughs in technology ultimately rely on basic science. Precisely for that reason, teaching AI **what scientific research is** becomes especially important. This is what I mean by “things only scientists will do”—training and educating AI to serve the scientific enterprise.

Along this direction, I have seen many seniors and peers whom I deeply admire devote themselves to related efforts, and I feel a strong resonance with their work:

* **Humanity's Last Exam** (arXiv:2501.14249)
* **PHYBench: Holistic Evaluation of Physical Perception and Reasoning in Large Language Models** (arXiv:2504.16074)
* **Probing the Critical Point (CritPt) of AI Reasoning: a Frontier Physics Research Benchmark** (arXiv:2509.26574)
* **CMT-Benchmark: A Benchmark for Condensed Matter Theory Built by Expert Researchers** (arXiv:2510.05228)
* **QMBench: A Research Level Benchmark for Quantum Materials Research** (arXiv:2512.19753)

… and so on. A closely related area is the development of **scientific agents**. In these directions, there are not only seniors, but also peers and even younger researchers who are extraordinarily impressive:

* **physmaster: Building an Autonomous AI Physicist for Theoretical and Computational Physics Research** (arXiv:2512.19799)

I have long advocated the view that “young scholars should do things that are of our era.” That belief is the backdrop of much of my advice to younger students. Then, as a young student myself, a natural question is: **what can I do for AI4S?** That question ultimately led to the birth of this work. Seeing the paper successfully appear online makes all the intense preparation and day-and-night effort feel worthwhile.

---

## Why Category Theory?

Compared with mature mathematical subjects like linear algebra and calculus—fields with abundant data and relatively straightforward verification—**category theory**, especially **higher category theory**, not only stands at the frontier of formal mathematical sciences, but in some sense even exceeds what unaided human cognition can comfortably manage.

Elementary category theory attracts many young people with its concise elegance. If one only cares about functoriality, it can feel almost like working with finite sets and maps. But the value of category theory goes far beyond that. To borrow Master **Kong Liang**’s phrasing, the essence of category theory is **“computing with structure.”** This makes it naturally compatible with many branches of mathematics. But deeper research demands far more computation and far more delicate lemmas.

For physicists, the rapid progress in **topological phases of matter** over the past decade has brought in a great deal of new mathematics—among which category theory is one of the most representative. To understand topological order in **four-dimensional spacetime**, one essentially needs **2-categories**. We learned angular momentum in elementary quantum mechanics; advanced quantum mechanics sometimes mentions its relation to classical **3j symbols**. Three-dimensional topological order requires **quantum 6j symbols**, and four-dimensional topological order can even require **quantum 15j symbols** and **20j symbols**. The associated computations are massive—often beyond what a human brain can hold.

Faced with this challenge at the edge of human intellectual capacity in frontier mathematical physics, a natural thought arises: **can we let AI do the computation?** This is one major motivation behind our work.

It is also worth noting that, over the past decade, the introduction and application of new mathematics in topological physics has been striking. Over the previous fifty years, string theory (and before that, perturbative QFT) introduced vast new mathematical machinery into formal theoretical physics. Now, might arenas such as the bootstrap, topological phases, symmetry, CFT, phase transitions, and critical phenomena become the forward outpost of new mathematics for our era?

(An intriguing viewpoint is that gravitational physics is deeply intertwined with topological physics. This perspective first arose from the loop-quantum-gravity community, and in recent developments in topological physics it has gained many implications—especially in low dimensions, where fairly rigorous relationships have almost been established.)

---

## Why Lean and Formal Proof?

Accordingly, we turned to **Lean**—one of the most mature platforms for formalized proof. The basic idea is: **if the code type-checks and runs, the proof is correct**, so proofs can be verified entirely at the machine level. The significance of this for mathematical proof is self-evident.

Historically, verifying major theorems and conjectures has consumed immense community effort: Perelman’s proof of the 3D Poincaré conjecture, Wiles’ proof of Fermat’s Last Theorem, Mochizuki’s claimed proof of the ABC conjecture via IUT theory, the Four Color Theorem, and so on. Even recently, there have been major claims still under intense scrutiny—e.g., verification efforts organized by institutions such as **BICMR** for certain announced results—and to this day the verification status of the classification of finite simple groups still feels, in practice, nontrivial to treat as completely “closed.”

Objectively, this reflects the importance of the Lean ecosystem itself and what formal verification can mean for mathematics. Subjectively, it also reflects our own prior accumulation in Lean and formal proof. Our team includes experts in category theory and mathematical physics; and this summer, **Rongge**’s team won the sole first prize at an **AI4S hackathon** hosted by **Tsinghua University’s IIIS (Institute for Interdisciplinary Information Sciences)** and **IASTU (Institute for Advanced Study, Tsinghua University)**. The project was called **“LeanBridge”**, building a bridge between LLMs and Lean for formal proof. Some introductions (in Chinese) can be found here:

* [https://mp.weixin.qq.com/s/A6EVpCtuCps0BVNzie24dg](https://mp.weixin.qq.com/s/A6EVpCtuCps0BVNzie24dg)
* [https://mp.weixin.qq.com/s/Tea0Ow0wlZcZxTw9ilRuag](https://mp.weixin.qq.com/s/Tea0Ow0wlZcZxTw9ilRuag)

---

## Next Steps…?

Over the past three years, the revolution of large language models has reshaped society. From everyday conversations to the ivory tower, everyone asks whether AI can add value to their work.

I strongly agree with a remark by **Andrew Ng**: deep learning is one circle, one’s own career is another circle, and their intersection (a Venn diagram) is where AI can truly help. For scientific research, where are the boundaries of AI’s assistance? Or is that intersection continually expanding?

I believe exploring the boundary of the intersection between AI and the scientific enterprise will be one of the most important themes of this era. A year ago, I might have thought AI’s contributions to science would mainly come from LLMs, agent systems, and symbolic reasoning. But the past year’s progress has gone far beyond that. Papers that are almost independently completed by AI have begun to appear: yesterday, the renowned Harvard particle physicist **Matthew Schwartz** uploaded to arXiv a preprint that was generated and written via AI-driven reasoning and computation, with human physicists mainly serving as supervisors. More and more theorists now explicitly acknowledge AI assistants in the acknowledgments of their papers.

So what is the next AI hotspot? My guess is **embodied intelligence**, **world models**, and **MCP**. All three are, without exception, about **how to teach AI to understand the physical world**. In this way, AI can step out of the screen and genuinely participate in scholarly and industrial practice in the physical world, further realizing the idea that **tools are extensions of human agency**. Prof. **Xiaoliang** holds a similar view: since training AI models has become relatively mature, the next step is to deploy them into real production and daily life through MCP.

---

## Acknowledgments and Closing

We thank the team of Prof. **Jian Li** at the School of Science, **Westlake University**, for hosting us: the final push of this work was completed there. I genuinely like Hangzhou as a city, and this was my first visit to Westlake University. As a small but elite emerging private university, Westlake left a deep impression on me in many ways: an outstanding faculty, responsible administration, excellent students and mentors, abundant research resources, and a strong academic atmosphere.

I personally love gentle sunshine, and winters in Jiangnan always leave me with warm memories. On my first visit to West Lake, discussions with Prof. **Jian Li**, Prof. **Wei Zhu**, Prof. **Guang Hong**, Prof. **Chong Wang**, and senior **Jianhao** benefited me greatly; what I learned will stay with me for a lifetime. I also thank the wonderful students at Westlake’s School of Science for their hospitality—spending time with them is a very pleasant memory.

Finally, we owe our deepest thanks to **Rongge**, whose dedication accounts for the vast majority of this work’s credit. Rongge is a student of Prof. **Jian Li** and Master **Kong Liang**, rigorously trained in topological phases of matter and category theory, and is now an outstanding postdoc at the **Qiu Center**. She is technically solid and full of ideas; without her sustained effort and relentless drive, this paper would not have seen the light of day.

I would like to close with a passage from the end of *The Princeton Companion to Mathematics*—a passage that appears before Atiyah’s advice to young mathematicians. I recommend that all students working in mathematical physics read this book:

> When computers first appeared in the mathematicians’ world, the nearly unanimous reaction was that they would never be useful for proving theorems… Yet the other end of the rainbow may be a far deeper role for computers.
> In a small number of areas of mathematics, we have already been able to do this… The road to this magnificent new world is still long, and no one has yet explored it.

**Jan 9, 2026**
