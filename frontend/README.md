# gerardomarr.com

A personal portfolio: **Home**, **Projects**, and **Writing**.

There is no CMS. Projects and the about-copy are typed dictionaries in the repo;
blog posts are markdown files in a folder. Everything is server-rendered and
works without JavaScript.

```sh
npm i
npm run dev        # http://localhost:44100
```

## Adding a project

Add one object to `PROJECTS` in `app/data/projects.ts`. Nothing else needs to
change — the projects page, the stack filter, and the prerendered pages all
derive from that list.

```ts
{
  id: 'newthing',
  name: 'New Thing',
  host: 'newthing.gerardomarr.com',        // bare domain, no protocol
  url: 'https://newthing.gerardomarr.com',
  kind: 'line',                            // pitch | bars | line | grid
  kindLabel: 'TREND SIGNAL',               // short all-caps label on the thumbnail
  blurb: 'What it does and what it runs on.',
  tech: ['Python', 'FastAPI'],             // drives the tags AND the stack filter
  series: [12, 18, 15, 27, 34],            // see below
  featured: false,                         // true = also show it on the home page
}
```

`series` means different things per `kind`:

| `kind`  | `series`                        | Thumbnail                      |
| ------- | ------------------------------- | ------------------------------ |
| `pitch` | unused, pass `[]`               | A football pitch with a pass chain |
| `bars`  | the values to plot (2+)         | A bar chart                    |
| `line`  | the values to plot (2+)         | A trend line with an end marker |
| `grid`  | indices of filled cells, `0..39` | An 8×5 grid                    |

Exactly three projects should be `featured` — those are the ones the home page
shows. A test enforces the count.

## Adding a blog post

Drop a `.md` file into `posts/`. The filename stem becomes the URL, so
`posts/2026-08-14-mmm-priors.md` is served at `/writing/2026-08-14-mmm-priors`.
Posts sort newest first; the home page links the two most recent.

Every post starts with exactly this block:

```yaml
---
title:   "Why your MMM keeps overcrediting brand"
hook:    "One sentence, about 140 characters, on what the reader walks away with."
date:    2026-08-14
minutes: 7
tags:    [mmm, marketing-science]
image:   ""        # optional; empty falls back to a generated plate
---
```

`title`, `hook`, `date` and `minutes` are required; `tags` and `image` are
optional. A malformed file **stops the server at startup** with the filename and
the problem, rather than breaking a page for a visitor. That is deliberate.

The body is normal markdown: headings, lists, links, bold, inline code, fenced
code blocks, blockquotes, images and tables all render. Two things do not —
raw HTML and task-list checkboxes — and you will see a console warning naming
anything unsupported rather than it silently vanishing.

The two files currently in `posts/` are samples with bracketed placeholder
titles. Delete them when you write the real thing.

## Editing what the home page says about you

`app/data/about.ts`. Your name, the tagline chips, the intro, the About
paragraphs, the closing line, and the three social URLs.

The three social links are `[YOUR GITHUB URL]`-style placeholders — fill them
in, along with the visible `github.com/[handle]` text in
`app/actions/home-page.tsx`.

A test pins the prose exactly as you wrote it, so nothing can quietly "improve"
your copy. If you revise it, update the test in the same commit.

## Layout

```
app/data/          projects, about, and the markdown post loader
app/utils/         pure helpers: front matter, dates, thumbnail geometry
app/ui/            shared components: shell, cards, article body, icons, theme
app/actions/       one folder per route area, each with its controller and pages
posts/             your blog posts
design/            the design canvas this was built from (*.dc.html)
prerender.ts       walks every route and writes static HTML to dist/
```

`design/*.dc.html` is the source of truth for every visual value. If the code
and the design disagree, the design is right.

## Commands

```sh
npm run dev         # dev server with reload
npm start           # production server
npm test            # remix test -- see the note in AGENTS.md
npm run typecheck
npm run prerender   # write the whole site to dist/ as static HTML
```

## Deploying

Two options, both open:

**As a Node server** (Azure Containers, like La Cancha). `npm start`. Everything
works, including the theme toggle and mobile menu.

**As static files** (Azure Static Web Apps, like trending). `npm run prerender`
writes every page to `dist/`. It exits non-zero rather than shipping a partial
site if anything fails.

⚠️ **One catch with the static route.** All CSS is inlined into the HTML, so
pages look and read correctly. But the two interactive pieces — the theme toggle
and the mobile menu — load their JavaScript from `/assets/`, which is served at
runtime by the Remix asset server. On a bare static host those requests 404: the
buttons render but do nothing, and the console fills with 404s. Everything else
— all content, navigation, the stack filters, articles — works fine, because
it's all real links and server-rendered HTML.

Making the static build fully self-contained means emitting the built assets
alongside `dist/`, which isn't wired up yet.
