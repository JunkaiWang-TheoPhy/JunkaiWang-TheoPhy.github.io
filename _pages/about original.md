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
<h2>Build a personal academic website in minutes</h2>

This is the front page of a website that is powered by the [Academic Pages template](https://github.com/academicpages/academicpages.github.io) and hosted on GitHub pages. [GitHub pages](https://pages.github.com) is a free service in which websites are built and hosted from code and data stored in a GitHub repository, automatically updating when a new commit is made to the repository. This template was forked from the [Minimal Mistakes Jekyll Theme](https://mmistakes.github.io/minimal-mistakes/) created by Michael Rose, and then extended to support the kinds of content that academics have: publications, talks, teaching, a portfolio, blog posts, and a dynamically-generated CV. Incidentally, these same features make it a great template for anyone that needs to show off a professional template.

You can fork [this template](https://github.com/academicpages/academicpages.github.io) right now, modify the configuration and Markdown files, add your own PDFs and other content, and have your own site for free, with no ads.

<div class="home-actions">
  <a class="home-button" href="/publications/">Publications</a>
  <a class="home-button home-button--ghost" href="/cv/">CV</a>
  <a class="home-button home-button--ghost" href="/talks/">Talks</a>
</div>
    </section>

    <section class="home-card fade-in" markdown="1">
## A data-driven personal website
Like many other Jekyll-based GitHub Pages templates, Academic Pages makes you separate the website's content from its form. The content and metadata of your website are in structured Markdown files, while various other files constitute the theme, specifying how to transform that content and metadata into HTML pages. You keep these various Markdown (.md), YAML (.yml), HTML, and CSS files in a public GitHub repository. Each time you commit and push an update to the repository, the [GitHub pages](https://pages.github.com/) service creates static HTML pages based on these files, which are hosted on GitHub's servers free of charge.

Many of the features of dynamic content management systems (like Wordpress) can be achieved in this fashion, using a fraction of the computational resources and with far less vulnerability to hacking and DDoSing. You can also modify the theme to your heart's content without touching the content of your site. If you get to a point where you've broken something in Jekyll, HTML, or CSS beyond repair, your Markdown files describing your talks, publications, and other content are safe. You can rollback the changes or even delete the repository and start over. You can also write scripts that process the structured data on the site, such as [this one](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.ipynb) that analyzes metadata in pages about talks to display [a map of every location you've given a talk](https://academicpages.github.io/talkmap.html).
    </section>

    <section class="home-card fade-in">
      <h2>Popular tools supported</h2>
      <table class="home-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th>Purpose</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>MathJax</td>
            <td>Mathematical equations</td>
            <td><a href="https://www.mathjax.org/">Site</a></td>
          </tr>
          <tr>
            <td>Mermaid</td>
            <td>Diagramming</td>
            <td><a href="https://mermaid.js.org/">Site</a></td>
          </tr>
          <tr>
            <td>Plotly</td>
            <td>Interactive plotting</td>
            <td><a href="https://plotly.com/javascript/">Site</a></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="home-card fade-in" markdown="1">
## Getting started
1. Register a GitHub account if you do not have one and confirm your e-mail (required).
2. Fork [this template](https://github.com/academicpages/academicpages.github.io) by clicking the "Use this template" button in the top right.
3. Go to the repository's settings (rightmost item in the tabs that start with "Code", should be below "Unwatch"). Rename the repository "[your GitHub username].github.io", which will also be your website's URL.
4. Set site-wide configuration and create content and metadata (see below, and see [this set of diffs](https://archive.is/3TPas) showing what files were changed to set up [an example site](https://getorg-testacct.github.io) for a user with the username "getorg-testacct").
5. Upload any files (like PDFs, .zip files, and other assets) to the files/ directory. They will appear at https://[your GitHub username].github.io/files/example.pdf.
6. Check status by going to the repository settings, in the "GitHub pages" section.
    </section>

    <section class="home-card fade-in" markdown="1">
## Site-wide configuration
The main configuration file for the site is in the base directory in [_config.yml](https://github.com/academicpages/academicpages.github.io/blob/master/_config.yml), which defines the content in the sidebars and other site-wide features. You will need to replace the default variables with ones about yourself and your site's GitHub repository. The configuration file for the top menu is in [_data/navigation.yml](https://github.com/academicpages/academicpages.github.io/blob/master/_data/navigation.yml). For example, if you do not have a portfolio or blog posts, you can remove those items from that navigation.yml file to remove them from the header.
    </section>

    <section class="home-card fade-in" markdown="1">
## Create content and metadata
For site content, there is one Markdown file for each type of content, which are stored in directories like _publications, _talks, _posts, _teaching, or _pages. For example, each talk is a Markdown file in the [_talks directory](https://github.com/academicpages/academicpages.github.io/tree/master/_talks). At the top of each Markdown file is structured data in YAML about the talk, which the theme will parse to do lots of cool stuff. The same structured data about a talk is used to generate the list of talks on the [Talks page](https://academicpages.github.io/talks), each [individual page](https://academicpages.github.io/talks/2012-03-01-talk-1) for specific talks, the talks section for the [CV page](https://academicpages.github.io/cv), and the [map of places you've given a talk](https://academicpages.github.io/talkmap.html) (if you run this [python file](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.py) or [Jupyter notebook](https://github.com/academicpages/academicpages.github.io/blob/master/talkmap.ipynb), which creates the HTML for the map based on the contents of the _talks directory).

### Markdown generator
The repository includes [a set of Jupyter notebooks](https://github.com/academicpages/academicpages.github.io/tree/master/markdown_generator) that converts a CSV containing structured data about talks or presentations into individual Markdown files that will be properly formatted for the Academic Pages template. The sample CSVs in that directory are the ones used to create a personal website at stuartgeiger.com. A common workflow is to keep a spreadsheet of publications and talks, run the code in these notebooks to generate the Markdown files, then commit and push them to the GitHub repository.
    </section>

    <section class="home-card fade-in" markdown="1">
## How to edit your site's GitHub repository
Many people use a git client to create files on their local computer and then push them to GitHub's servers. If you are not familiar with git, you can directly edit these configuration and Markdown files directly in the github.com interface. Navigate to a file (like [this one](https://github.com/academicpages/academicpages.github.io/blob/master/_talks/2012-03-01-talk-1.md)) and click the pencil icon in the top right of the content preview (to the right of the "Raw | Blame | History" buttons). You can delete a file by clicking the trashcan icon to the right of the pencil icon. You can also create new files or upload files by navigating to a directory and clicking the "Create new file" or "Upload files" buttons.

Example: editing a Markdown file for a talk
![Editing a Markdown file for a talk](/images/editing-talk.png)
    </section>

    <section class="home-card fade-in" markdown="1">
## For more info
More info about configuring Academic Pages can be found in [the guide](https://academicpages.github.io/markdown/), the [growing wiki](https://github.com/academicpages/academicpages.github.io/wiki), and you can always [ask a question on GitHub](https://github.com/academicpages/academicpages.github.io/discussions). The guides for the Minimal Mistakes theme (which this theme was forked from) might also be helpful.
    </section>
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
