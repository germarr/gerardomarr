# Personal portfolio in Remix 3 — design

Date: 2026-08-22
Status: approved

## Purpose

Build gerardomarr.com: a personal portfolio for a data scientist, with three
sections — Home, Projects, Writing. No CMS. Projects and about-copy live in
typed dictionaries in the repo; blog posts are markdown files dropped into a
folder.

The visual design is settled and fully specified in `design/*.dc.html` (a
published design canvas). This spec covers implementation only. Where this
document and the canvas disagree about a pixel value, the canvas wins.

## Decisions already made

| Decision | Choice | Why |
| --- | --- | --- |
| Hosting | Server-first, prerender later | Build real routes returning real `Response`s, then a script that walks them and emits static HTML. Keeps both Azure Containers and Azure Static Web Apps open. |
| Markdown | `marked` + hand-rolled front matter | One new dependency, zero transitive deps. Front matter is a fixed six-field block, so a full YAML parser is unnecessary. Use `marked`'s lexer for tokens, not its HTML output. |
| Parse timing | Eager at boot | Milliseconds at this scale; prerender pays it once; a malformed post fails at startup, not on a visitor. Dev adds an mtime check so edits appear without a restart. |
| Interactivity | Theme + mobile menu client-side; projects filter via URL | Two small client entries. The filter is a URL — works without JS, is linkable, and prerenders per variant. |

### Correction to the approved shape

The filter was approved as `/projects?stack=python`. A query string cannot
prerender: a static host serves one file per path regardless of query, so every
filter would return the unfiltered page. The filter is therefore a **path
segment** — `/projects/stack/python` — which prerenders to its own file and
behaves identically under a running server. Nothing else about the decision
changes.

## Architecture

### Content layer

```
posts/                     markdown files, one per article (repo root)
app/data/about.ts          about + social dictionary
app/data/projects.ts       projects dictionary
app/data/posts.ts          reads and parses posts/*.md at boot
```

`app/data/projects.ts` exports `PROJECTS`, matching the shape documented on the
ProjectCard sheet in the canvas:

```ts
type ProjectKind = 'pitch' | 'bars' | 'line' | 'grid'

interface Project {
  id: string
  name: string
  host: string          // bare domain, no protocol
  url: string
  kind: ProjectKind     // thumbnail motif
  kindLabel: string     // e.g. 'QUEUE TELEMETRY'
  blurb: string
  tech: string[]        // drives both the tags and the stack filter
  series: number[]      // 'bars'/'line': the plotted values.
                        // 'grid': indices of the filled cells.
                        // 'pitch': unused — that motif is fixed geometry.
  featured: boolean     // true for the three shown on Home
}
```

Adding a project is one object. Home renders `PROJECTS.filter(p => p.featured)`,
Projects renders all of them, and the stack chips derive from the union of
`tech` across the list. There is no second copy of any project anywhere.

`app/data/about.ts` exports `ABOUT`: name, tagline chips, intro paragraph, the
About lead and body paragraphs, the pull-quote, and `social.{github,linkedin,
instagram}`.

`app/data/posts.ts` exports a sorted index and a slug lookup. At module load it
reads `posts/*.md`, splits front matter from body, and runs the body through
`marked`'s lexer. The slug is the filename stem. Posts sort by `date`
descending. In development each read re-checks mtime so an edited or added post
appears on the next request without restarting the server.

Front matter, exactly six fields:

```yaml
---
title:   "[Title — up to about 60 characters]"
hook:    "[Hook — one sentence, about 140 characters.]"
date:    2026-08-14
minutes: 7
tags:    [mmm, marketing-science]
image:   ""        # optional; empty falls back to a generated plate
---
```

### Pure helpers

Testable without a router, request, or `Response`:

- `app/utils/front-matter.ts` — split and parse the front-matter block
- `app/utils/thumbnails.ts` — `linePath`, `areaPath`, `barsPath`, `cellsPath`,
  `lastPoint`; the geometry lifted from the canvas
- `app/utils/dates.ts` — display date formatting

### Route contract

```ts
// app/routes.ts
export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  projects: route('/projects', {
    index: get('/'),
    byStack: get('/stack/:tag'),
  }),
  writing: route('/writing', {
    index: get('/'),
    post: get('/:slug'),
  }),
})
```

All internal links use `routes.<name>.href(...)`. No hand-written URL strings.

### Controllers

- `app/actions/controller.tsx` — `assets`, `home`
- `app/actions/projects/controller.tsx` — `index`, `byStack`
- `app/actions/writing/controller.tsx` — `index`, `post`

`app/router.ts` maps all three: `router.map(routes, controller)`,
`router.map(routes.projects, projectsController)`, and
`router.map(routes.writing, writingController)`.

`byStack` filters on the `:tag` param. An unrecognised tag renders the empty
state rather than 404-ing, so a stale link degrades gracefully. `post` returns a
real 404 `Response` for an unknown slug.

### UI

All three sections share the shell and both card types, so these live in
`app/ui/`:

- `theme.ts` — the oklch token block (light plus `[data-theme="dark"]`
  overrides), applied once at the document level
- `shell.tsx` — document, header with nav and theme toggle, footer
- `section-rule.tsx` — the `01 ──── ABOUT` numbered section header
- `project-card.tsx` — variants `index` (2-up, 18px name, 22px padding) and
  `home` (3-up, 15px name, 18px padding), per the ProjectCard spec sheet
- `post-card.tsx` — variants `featured`, `row`, `compact`
- `thumbnail.tsx` — renders the pitch / bars / line / grid motif for a project
- `article-body.tsx` — maps `marked` tokens to styled elements
- `icons.tsx` — inline SVG only: arrow, back-arrow, moon, menu, close, GitHub,
  LinkedIn, Instagram

Styling uses `mix={css(...)}` with the exact values from the canvas. No emoji or
dingbat glyphs are used as icons anywhere.

The article page's table of contents is derived server-side from the `h2`/`h3`
tokens of the post being rendered.

### Client entries

Under `app/actions/public/`, both with serializable props only:

- `theme-toggle.tsx` — reads and writes `localStorage`, sets `data-theme` on the
  document element
- `mobile-menu.tsx` — open/close state for the 390px header

Plus a small inline script in the document head that applies the stored theme
before first paint, so there is no flash.

### Prerender

`prerender.ts` at the repo root, beside `server.ts`. It imports the router and
walks:

- `/`
- `/projects`, plus `/projects/stack/<tag>` for every tag in the union
- `/writing`
- `/writing/<slug>` for every post

Each response is written to `dist/<path>/index.html`, along with the built
assets. Every prerendered URL is a plain path, so each maps to exactly one file.
Exposed as `npm run prerender`.

## Testing

- Router tests per controller: `app/actions/controller.test.tsx`,
  `app/actions/projects/controller.test.tsx`, and
  `app/actions/writing/controller.test.tsx`. Drive with
  `router.fetch(new Request(routes.<name>.href(...)))` and assert on the
  `Response` — status, and that the rendered HTML contains the expected content.
- Unit tests beside each `app/utils` module.
- A test for `app/data/posts.ts` against a fixture directory, covering front
  matter parsing, slug derivation, and date sorting.
- Component tests only for the two client entries, where behaviour is genuinely
  DOM-specific.

Coverage aims at one representative test per behaviour, not exhaustive variants.

## Placeholder content

Two decisions that ship as visibly-marked placeholders, to be replaced by the
site owner:

1. `posts/` ships with two sample markdown files so the writing pages render.
   They are clearly marked as samples and are meant to be deleted.
2. The three social URLs in `app/data/about.ts` are `[YOUR GITHUB URL]`-style
   placeholders until real ones are supplied.

## Out of scope

- Search, tags-as-pages, pagination, RSS
- Analytics, comments, contact forms
- Image optimisation — project thumbnails are generated SVG from `series` data;
  a post `image` is used as-is
- Deployment configuration and CI

## Open items

- The exact nested-route-map syntax in `app/routes.ts` and the corresponding
  `router.map` call must be confirmed against
  `.agents/skills/remix/references/routing-and-controllers.md` before writing
  `routes.ts`. The shape above is the intent, not a verified API.
