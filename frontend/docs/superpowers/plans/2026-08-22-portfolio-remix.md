# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build gerardomarr.com — a three-section personal portfolio (Home, Projects, Writing) as a Remix 3 app, with content in typed dictionaries and blog posts as markdown files.

**Architecture:** Server-first. Content loads eagerly at boot from `app/data/*` and `posts/*.md`. Three controllers own the route map. Shared UI lives in `app/ui/` and is styled with `mix={css(...)}` using values lifted from the design canvas. Two small client entries add the theme toggle and mobile menu; everything else works without JavaScript. A prerender script walks every route and writes static HTML.

**Tech Stack:** Remix 3.0.0-beta.10, TypeScript, `marked` 18 (markdown lexer only), Node's test runner via `remix/test` + `remix/assert`.

**Design source of truth:** `design/*.dc.html` (committed). Where this plan and the canvas disagree about a pixel value, the canvas wins. The spec is `docs/superpowers/specs/2026-08-22-portfolio-remix-design.md`.

---

## Verified APIs

These were confirmed empirically against the installed packages before this plan was written. Do not second-guess them.

**Nested routes.** `route('projects', { index: '/', byStack: get('stack/:tag') })` generates `/projects` and `/projects/stack/python`. Prefixes have no leading slash; nested leaves are relative.

**Controllers.** `createController(routes.projects, { actions: { index({ render, url }) {...}, byStack({ render, params }) {...} } })`. The context object destructures — `render`, `url`, `params`, `request`, `get` are all properties. `params.tag` is typed from the route.

**Nested maps must be registered explicitly** in `app/router.ts`: `router.map(routes.projects, projectsController)`.

**Tests.** Use `import { describe, it } from 'remix/test'` and `import * as assert from 'remix/assert'`, run via `npm test`. The singleton `router` export from `app/router.ts` responds to `router.fetch(new Request(...))`. `console.log` inside a test is swallowed by the reporter — assert instead of logging.

> **Corrected during Task 1.** The scaffold shipped `"test": "node --import remix/node-tsx --test"`, which **silently never executes `remix/test` bodies** — a test containing an unconditional `throw` still reported `pass, fail 0`. Every "expected: FAIL" step in this plan would have been meaningless. Task 1 changed the script to `remix test` (the convention the project's own remix skill documents) and added `playwright` as a devDependency, working around a stray runtime import of `./playwright.js` in `@remix-run/test`'s compiled runner. **Do not revert either change.** When a step says "run to verify it fails", confirm you actually see a non-zero fail count — a green run at that point means the harness is broken again, not that the code is done.

**marked tokens.** `marked.lexer(md)` returns block tokens. Types seen: `paragraph`, `heading` (`depth`, `text`, `tokens`), `list` (`ordered`, `items[]`), `blockquote` (`tokens`), `code` (`lang`, `text`), `hr`, `space`. `space` tokens must be skipped. Inline tokens on `paragraph.tokens`: `text`, `link` (`href`, `text`), `strong`, `em`, `codespan`, `image` (`href`, `text`). **List items nest one level deeper:** `list.items[i].tokens` is `[{ type: 'text', tokens: [...inline] }]`.

---

## File Structure

**Content**
- `posts/*.md` — one file per article, filename stem is the slug
- `app/data/about.ts` — `ABOUT` dictionary
- `app/data/projects.ts` — `PROJECTS` dictionary and `Project` type
- `app/data/posts.ts` — reads and parses `posts/*.md`, exports index + lookup

**Pure helpers (no router, no Response)**
- `app/utils/front-matter.ts` — split and parse the front-matter block
- `app/utils/thumbnails.ts` — SVG path geometry
- `app/utils/dates.ts` — display date formatting

**Routing**
- `app/routes.ts` — the route contract
- `app/router.ts` — registers three controllers
- `app/actions/controller.tsx` — `assets`, `home`
- `app/actions/projects/controller.tsx` — `index`, `byStack`
- `app/actions/writing/controller.tsx` — `index`, `post`

**Route-local pages**
- `app/actions/home-page.tsx` — replaces the scaffold's starter page
- `app/actions/projects/projects-page.tsx`
- `app/actions/writing/writing-page.tsx`
- `app/actions/writing/article-page.tsx`

**Shared UI**
- `app/ui/theme.ts` — token block, one exported style descriptor
- `app/ui/shell.tsx` — document, header/nav, footer
- `app/ui/section-rule.tsx` — the `01 ──── ABOUT` header
- `app/ui/project-card.tsx` — variants `index` and `home`
- `app/ui/post-card.tsx` — variants `featured`, `row`, `compact`
- `app/ui/thumbnail.tsx` — pitch / bars / line / grid motifs
- `app/ui/article-body.tsx` — marked tokens to styled elements
- `app/ui/icons.tsx` — inline SVG icons

**Client entries**
- `app/actions/public/theme-toggle.tsx`
- `app/actions/public/mobile-menu.tsx`

**Build**
- `prerender.ts` — repo root, beside `server.ts`

---

## Task 1: Dependency and route contract

**Files:**
- Modify: `package.json`
- Modify: `app/routes.ts`
- Test: `app/routes.test.ts`

- [ ] **Step 1: Confirm `marked` is installed**

Run: `node -p "require('marked/package.json').version"`
Expected: `18.0.10` or later. If it errors, run `npm i marked`.

- [ ] **Step 2: Write the failing test**

Create `app/routes.test.ts`:

```ts
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { routes } from './routes.ts'

describe('route contract', () => {
  it('generates every URL the site links to', () => {
    assert.equal(routes.home.href(), '/')
    assert.equal(routes.projects.index.href(), '/projects')
    assert.equal(routes.projects.byStack.href({ tag: 'python' }), '/projects/stack/python')
    assert.equal(routes.writing.index.href(), '/writing')
    assert.equal(routes.writing.post.href({ slug: 'hello-world' }), '/writing/hello-world')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `routes.projects` is undefined.

- [ ] **Step 4: Write the route contract**

Replace `app/routes.ts` entirely:

```ts
import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  projects: route('projects', {
    index: '/',
    byStack: get('stack/:tag'),
  }),
  writing: route('writing', {
    index: '/',
    post: get(':slug'),
  }),
})
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app/routes.ts app/routes.test.ts
git commit -m "Add marked and the portfolio route contract"
```

---

## Task 2: Front-matter parser

**Files:**
- Create: `app/utils/front-matter.ts`
- Test: `app/utils/front-matter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/utils/front-matter.test.ts`:

```ts
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { parseFrontMatter } from './front-matter.ts'

const SAMPLE = `---
title:   "Modelling messy data"
hook:    "What survives contact with reality."
date:    2026-08-14
minutes: 7
tags:    [mmm, marketing-science]
image:   ""
---

Body starts here.

## A heading
`

describe('parseFrontMatter', () => {
  it('parses every field', () => {
    let { frontMatter } = parseFrontMatter(SAMPLE, 'a.md')
    assert.equal(frontMatter.title, 'Modelling messy data')
    assert.equal(frontMatter.hook, 'What survives contact with reality.')
    assert.equal(frontMatter.date, '2026-08-14')
    assert.equal(frontMatter.minutes, 7)
    assert.deepEqual(frontMatter.tags, ['mmm', 'marketing-science'])
    assert.equal(frontMatter.image, '')
  })

  it('returns the body without the front matter', () => {
    let { body } = parseFrontMatter(SAMPLE, 'a.md')
    assert.equal(body.startsWith('Body starts here.'), true)
    assert.equal(body.includes('title:'), false)
  })

  it('throws naming the file when the block is missing', () => {
    assert.throws(() => parseFrontMatter('no front matter here', 'broken.md'), /broken\.md/)
  })

  it('throws naming the missing field', () => {
    let missing = `---\ntitle: "T"\nhook: "H"\ndate: 2026-01-01\ntags: []\nimage: ""\n---\nbody\n`
    assert.throws(() => parseFrontMatter(missing, 'nomin.md'), /minutes/)
  })

  it('handles an empty tag list', () => {
    let empty = SAMPLE.replace('[mmm, marketing-science]', '[]')
    assert.deepEqual(parseFrontMatter(empty, 'a.md').frontMatter.tags, [])
  })

  it('returns an empty body when nothing follows the closing delimiter', () => {
    let noBody = `---\ntitle: "T"\nhook: "H"\ndate: 2026-01-01\nminutes: 3\ntags: []\nimage: ""\n---`
    assert.equal(parseFrontMatter(noBody, 'nobody.md').body, '')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./front-matter.ts`.

- [ ] **Step 3: Write the implementation**

Create `app/utils/front-matter.ts`:

```ts
export interface FrontMatter {
  title: string
  hook: string
  date: string
  minutes: number
  tags: string[]
  image: string
}

export interface ParsedFile {
  frontMatter: FrontMatter
  body: string
}

const DELIMITER = '---'

/**
 * Parse the fenced front-matter block at the top of a post.
 *
 * Deliberately not a YAML parser: the schema is a fixed six fields, so this
 * handles exactly quoted strings, bare scalars, and inline `[a, b]` lists.
 * `filename` is only used to make failures identifiable.
 */
export function parseFrontMatter(source: string, filename: string): ParsedFile {
  let text = source.replace(/^﻿/, '').replace(/\r\n/g, '\n')

  if (!text.startsWith(DELIMITER + '\n')) {
    throw new Error(`${filename}: missing opening --- front-matter delimiter`)
  }

  let end = text.indexOf('\n' + DELIMITER, DELIMITER.length)
  if (end === -1) {
    throw new Error(`${filename}: missing closing --- front-matter delimiter`)
  }

  let block = text.slice(DELIMITER.length + 1, end)
  // -1 when nothing follows the closing delimiter; slice(0) would otherwise
  // return the whole document, front matter included.
  let bodyStart = text.indexOf('\n', end + 1)
  let body = bodyStart === -1 ? '' : text.slice(bodyStart + 1).trim()

  let fields = new Map<string, string>()
  for (let line of block.split('\n')) {
    let trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue

    let colon = trimmed.indexOf(':')
    if (colon === -1) throw new Error(`${filename}: cannot parse front-matter line "${trimmed}"`)

    let key = trimmed.slice(0, colon).trim()
    let value = stripComment(trimmed.slice(colon + 1).trim())
    fields.set(key, value)
  }

  return {
    frontMatter: {
      title: requireString(fields, 'title', filename),
      hook: requireString(fields, 'hook', filename),
      date: requireDate(fields, 'date', filename),
      minutes: requireNumber(fields, 'minutes', filename),
      tags: parseList(fields.get('tags') ?? '[]'),
      image: unquote(fields.get('image') ?? ''),
    },
    body,
  }
}

/** Strip a trailing `# comment`, but only outside quotes. */
function stripComment(value: string): string {
  if (value.startsWith('"') || value.startsWith("'")) {
    let quote = value[0]
    let close = value.indexOf(quote, 1)
    if (close !== -1) return value.slice(0, close + 1)
    return value
  }
  let hash = value.indexOf('#')
  return hash === -1 ? value : value.slice(0, hash).trim()
}

function unquote(value: string): string {
  if (value.length >= 2 && (value.startsWith('"') || value.startsWith("'"))) {
    if (value.endsWith(value[0])) return value.slice(1, -1)
  }
  return value
}

function parseList(value: string): string[] {
  let inner = value.trim()
  if (!inner.startsWith('[') || !inner.endsWith(']')) return []
  inner = inner.slice(1, -1).trim()
  if (inner === '') return []
  return inner.split(',').map((entry) => unquote(entry.trim())).filter(Boolean)
}

function requireString(fields: Map<string, string>, key: string, filename: string): string {
  let raw = fields.get(key)
  if (raw === undefined) throw new Error(`${filename}: front matter is missing "${key}"`)
  let value = unquote(raw)
  if (value === '') throw new Error(`${filename}: front matter "${key}" is empty`)
  return value
}

function requireDate(fields: Map<string, string>, key: string, filename: string): string {
  let value = unquote(fields.get(key) ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${filename}: front matter "${key}" must be YYYY-MM-DD, got "${value}"`)
  }
  return value
}

function requireNumber(fields: Map<string, string>, key: string, filename: string): number {
  let raw = fields.get(key)
  if (raw === undefined) throw new Error(`${filename}: front matter is missing "${key}"`)
  let value = Number.parseInt(unquote(raw), 10)
  if (!Number.isFinite(value)) {
    throw new Error(`${filename}: front matter "${key}" must be a number, got "${raw}"`)
  }
  return value
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 5 assertions in `front-matter.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add app/utils/front-matter.ts app/utils/front-matter.test.ts
git commit -m "Add front-matter parser for blog posts"
```

> **Hardened after review.** The reference implementation above silently
> corrupted content on several plausible author typos. As shipped, the parser
> additionally throws on: an unterminated quote, a `tags:` value that is not a
> bracketed list, a duplicate key, and a `minutes` value with trailing
> non-numeric text; and it splits tag lists quote-aware so `["a, b", c]`
> survives. `tags` and `image` remain optional (missing → `[]` / `''`); only
> `title`/`hook`/`date`/`minutes` are required. See commits `bf98081`,
> `7a9e034`, `9b6b2ec` for the shipped version, which is the authority over the
> snippet above.

---

## Task 3: Thumbnail geometry

**Files:**
- Create: `app/utils/thumbnails.ts`
- Test: `app/utils/thumbnails.test.ts`

This is the geometry from `design/Projects.dc.html`, lifted verbatim. The viewBox is always `0 0 320 200` and the default padding is `28`.

- [ ] **Step 1: Write the failing test**

Create `app/utils/thumbnails.test.ts`:

```ts
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { areaPath, barsPath, cellsPath, lastPoint, linePath } from './thumbnails.ts'

const SERIES = [12, 18, 15, 27, 34, 30, 46, 58, 51, 72, 88, 96]

describe('linePath', () => {
  it('starts at the left pad and ends at the right pad', () => {
    let d = linePath(SERIES, 28)
    assert.equal(d.startsWith('M28.0 '), true)
    assert.equal(d.endsWith('292.0 28.0'), true)
  })

  it('emits one command per point', () => {
    assert.equal(linePath(SERIES, 28).split(' L').length, SERIES.length)
  })
})

describe('areaPath', () => {
  it('closes the shape along the baseline', () => {
    assert.equal(areaPath(SERIES, 28).endsWith('L292 172 L28 172 Z'), true)
  })
})

describe('barsPath', () => {
  it('emits one closed rect per value', () => {
    let d = barsPath([1, 2, 3], 28, 6)
    assert.equal((d.match(/Z/g) ?? []).length, 3)
  })

  it('makes the tallest bar reach the top pad', () => {
    assert.equal(barsPath([1, 2, 4], 28, 6).includes('M208.0 28.0'), true)
  })
})

describe('cellsPath', () => {
  it('emits every cell when no filter is given', () => {
    assert.equal((cellsPath(8, 5, 28, null).match(/Z/g) ?? []).length, 40)
  })

  it('emits only the requested cells', () => {
    assert.equal((cellsPath(8, 5, 28, [0, 3, 9]).match(/Z/g) ?? []).length, 3)
  })
})

describe('lastPoint', () => {
  it('lands on the final plotted point', () => {
    let point = lastPoint(SERIES, 28)
    assert.equal(point.x, '292.0')
    assert.equal(point.y, '28.0')
  })

  it('tracks a series that does not peak last', () => {
    assert.equal(lastPoint([10, 90, 50], 28).y, '100.0')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./thumbnails.ts`.

- [ ] **Step 3: Write the implementation**

Create `app/utils/thumbnails.ts`:

```ts
/**
 * SVG path geometry for project thumbnails. Every path is drawn inside a
 * `0 0 320 200` viewBox. Lifted from design/Projects.dc.html.
 */
const W = 320
const H = 200

export function linePath(values: number[], pad: number): string {
  let n = values.length
  let max = Math.max(...values)
  let min = Math.min(...values)
  let span = max - min || 1
  let d = ''
  for (let i = 0; i < n; i++) {
    let x = pad + (i / (n - 1)) * (W - pad * 2)
    let y = H - pad - ((values[i]! - min) / span) * (H - pad * 2)
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '
  }
  return d.trim()
}

export function areaPath(values: number[], pad: number): string {
  return `${linePath(values, pad)} L${W - pad} ${H - pad} L${pad} ${H - pad} Z`
}

export function barsPath(values: number[], pad: number, gap: number): string {
  let n = values.length
  let max = Math.max(...values)
  let barWidth = (W - pad * 2 - gap * (n - 1)) / n
  let d = ''
  for (let i = 0; i < n; i++) {
    let x = pad + i * (barWidth + gap)
    let barHeight = (values[i]! / max) * (H - pad * 2)
    let y = H - pad - barHeight
    d +=
      'M' + x.toFixed(1) + ' ' + y.toFixed(1) +
      ' h' + barWidth.toFixed(1) +
      ' v' + barHeight.toFixed(1) +
      ' h-' + barWidth.toFixed(1) + ' Z '
  }
  return d.trim()
}

export function cellsPath(
  columns: number,
  rows: number,
  pad: number,
  only: number[] | null,
): string {
  let cellWidth = (W - pad * 2) / columns
  let cellHeight = (H - pad * 2) / rows
  let size = Math.min(cellWidth, cellHeight) - 5
  let d = ''
  for (let i = 0; i < columns * rows; i++) {
    if (only && !only.includes(i)) continue
    let x = pad + (i % columns) * cellWidth
    let y = pad + Math.floor(i / columns) * cellHeight
    d +=
      'M' + x.toFixed(1) + ' ' + y.toFixed(1) +
      ' h' + size.toFixed(1) +
      ' v' + size.toFixed(1) +
      ' h-' + size.toFixed(1) + ' Z '
  }
  return d.trim()
}

/** End marker for the line motif — computed, never hard-coded. */
export function lastPoint(values: number[], pad: number): { x: string; y: string } {
  let max = Math.max(...values)
  let min = Math.min(...values)
  let span = max - min || 1
  let last = values[values.length - 1]!
  return {
    x: (W - pad).toFixed(1),
    y: (H - pad - ((last - min) / span) * (H - pad * 2)).toFixed(1),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/utils/thumbnails.ts app/utils/thumbnails.test.ts
git commit -m "Add thumbnail path geometry"
```

---

## Task 4: Date formatting

**Files:**
- Create: `app/utils/dates.ts`
- Test: `app/utils/dates.test.ts`

Deliberately avoids `Intl` so output is identical on every machine and in prerender.

- [ ] **Step 1: Write the failing test**

Create `app/utils/dates.test.ts`:

```ts
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { formatPostDate } from './dates.ts'

describe('formatPostDate', () => {
  it('formats as uppercase month, day, year', () => {
    assert.equal(formatPostDate('2026-08-14'), 'AUG 14 2026')
  })

  it('does not pad the day', () => {
    assert.equal(formatPostDate('2026-01-05'), 'JAN 5 2026')
  })

  it('throws on a malformed date', () => {
    assert.throws(() => formatPostDate('14/08/2026'), /YYYY-MM-DD/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./dates.ts`.

- [ ] **Step 3: Write the implementation**

Create `app/utils/dates.ts`:

```ts
const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

/** `2026-08-14` -> `AUG 14 2026`. No Intl, so prerender output is stable. */
export function formatPostDate(iso: string): string {
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) throw new Error(`Expected a YYYY-MM-DD date, got "${iso}"`)

  let [, year, month, day] = match
  let name = MONTHS[Number.parseInt(month!, 10) - 1]
  if (!name) throw new Error(`Expected a YYYY-MM-DD date, got "${iso}"`)

  return `${name} ${Number.parseInt(day!, 10)} ${year}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/utils/dates.ts app/utils/dates.test.ts
git commit -m "Add post date formatting"
```

---

## Task 5: Projects and about dictionaries

**Files:**
- Create: `app/data/projects.ts`
- Create: `app/data/about.ts`
- Test: `app/data/projects.test.ts`

Content comes from `personal_notes.md` and the canvas. The `depelicula` host for Queue Scope and the `lacancha.gerardomarr.com` spelling are both confirmed correct by the site owner — do not "fix" them.

- [ ] **Step 1: Write the failing test**

Create `app/data/projects.test.ts`:

```ts
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { PROJECTS, featuredProjects, projectsByStack, stackTags } from './projects.ts'

describe('PROJECTS', () => {
  it('marks exactly three as featured', () => {
    assert.equal(featuredProjects().length, 3)
  })

  it('gives every project a non-empty stack', () => {
    for (let project of PROJECTS) assert.equal(project.tech.length > 0, true)
  })

  it('gives bars and line projects a series to plot', () => {
    for (let project of PROJECTS) {
      if (project.kind === 'bars' || project.kind === 'line') {
        assert.equal(project.series.length > 1, true)
      }
    }
  })

  it('has unique ids', () => {
    assert.equal(new Set(PROJECTS.map((p) => p.id)).size, PROJECTS.length)
  })
})

describe('stackTags', () => {
  it('derives tags from the projects themselves, most common first', () => {
    let tags = stackTags()
    assert.equal(tags.includes('Python'), true)
    assert.equal(tags[0], 'FastAPI')
  })

  it('lists each tag once', () => {
    assert.equal(new Set(stackTags()).size, stackTags().length)
  })
})

describe('projectsByStack', () => {
  it('filters on the slugified tag', () => {
    let filtered = projectsByStack('python')
    assert.equal(filtered.length > 0, true)
    for (let project of filtered) assert.equal(project.tech.includes('Python'), true)
  })

  it('returns nothing for an unknown tag', () => {
    assert.deepEqual(projectsByStack('cobol'), [])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./projects.ts`.

- [ ] **Step 3: Write the projects dictionary**

Create `app/data/projects.ts`:

```ts
export type ProjectKind = 'pitch' | 'bars' | 'line' | 'grid'

export interface Project {
  id: string
  name: string
  /** Bare domain, no protocol. */
  host: string
  url: string
  kind: ProjectKind
  /** Two or three words, shown top-left inside the thumbnail. */
  kindLabel: string
  blurb: string
  /** Drives both the tags on the card and the stack filter. */
  tech: string[]
  /**
   * 'bars' and 'line': the plotted values.
   * 'grid': indices of the filled cells.
   * 'pitch': unused, that motif is fixed geometry.
   */
  series: number[]
  /** The three shown on the home page. */
  featured: boolean
}

// ─────────────────────────────────────────────────────────────────────────
// Add a project by adding an object here. The stack filter rebuilds itself
// from `tech`, and the home page picks up anything marked `featured`.
// ─────────────────────────────────────────────────────────────────────────
export const PROJECTS: Project[] = [
  {
    id: 'lacancha',
    name: 'La Cancha',
    host: 'lacancha.gerardomarr.com',
    url: 'https://lacancha.gerardomarr.com',
    kind: 'pitch',
    kindLabel: 'FOOTBALL DATA',
    blurb:
      'An Astro front end on Azure Containers over a Postgres and PocketBase back end, fed live by Football-API and shipped through GitHub Actions.',
    tech: ['Astro', 'Postgres', 'PocketBase', 'Azure', 'Football-API', 'GitHub Actions'],
    series: [],
    featured: true,
  },
  {
    id: 'queuescope',
    name: 'Queue Scope',
    host: 'depelicula.gerardomarr.com',
    url: 'https://depelicula.gerardomarr.com',
    kind: 'bars',
    kindLabel: 'QUEUE TELEMETRY',
    blurb:
      'A live wait-time dashboard for Universal Orlando. A cron collector polls themeparks.wiki every minute into SQLite; a FastAPI app charts how ride queues move across the day, week and month, with weather overlaid on the trend.',
    tech: ['Python', 'FastAPI', 'SQLite', 'pandas', 'Chart.js'],
    series: [34, 52, 71, 96, 88, 63, 47, 58, 82, 74, 45, 30],
    featured: true,
  },
  {
    id: 'trending',
    name: 'Trending',
    host: 'trending.gerardomarr.com',
    url: 'https://trending.gerardomarr.com',
    kind: 'line',
    kindLabel: 'TREND SIGNAL',
    blurb:
      'What YouTube is pushing, tracked over time. A FastAPI service on an Azure VM collects and serves the data behind a static front end deployed to Azure Static Web Apps.',
    tech: ['Python', 'FastAPI', 'Azure', 'GitHub Actions'],
    series: [12, 18, 15, 27, 34, 30, 46, 58, 51, 72, 88, 96],
    featured: true,
  },
  {
    id: 'movies',
    name: 'Movies MX',
    host: 'movies.gerardomarr.com',
    url: 'https://movies.gerardomarr.com',
    kind: 'grid',
    kindLabel: 'SCREENINGS',
    blurb:
      'A dashboard tracking which movies are being screened across Mexico, and how that mix shifts week to week.',
    tech: ['Python', 'FastAPI', 'SQLite', 'pandas', 'Chart.js'],
    series: [1, 2, 5, 8, 9, 11, 14, 17, 18, 19, 22, 25, 26, 29, 33, 34, 37],
    featured: false,
  },
]

/** URL-safe form of a tag: `Chart.js` -> `chart-js`. */
export function slugifyTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function featuredProjects(): Project[] {
  return PROJECTS.filter((project) => project.featured)
}

/** Every tag across every project, most widely used first, then alphabetical. */
export function stackTags(): string[] {
  let counts = new Map<string, number>()
  for (let project of PROJECTS) {
    for (let tag of project.tech) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b))
}

export function projectsByStack(tagSlug: string): Project[] {
  return PROJECTS.filter((project) => project.tech.some((tag) => slugifyTag(tag) === tagSlug))
}
```

- [ ] **Step 4: Write the about dictionary**

Create `app/data/about.ts`:

```ts
export interface About {
  name: string
  /** The chips under the name. */
  tagline: string[]
  intro: string
  /** The large opening line of the About section. */
  lead: string
  body: string[]
  /** The prompt-marked closing line. */
  kicker: string
  social: {
    github: string
    linkedin: string
    instagram: string
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Edit this to change everything the home page says about you.
// The three social URLs are placeholders until real ones are supplied.
// ─────────────────────────────────────────────────────────────────────────
export const ABOUT: About = {
  name: 'Gerardo Martinez',
  tagline: ['Applied Data', 'Marketing Science', 'Python', 'AI on the Edge'],
  intro:
    'Data Scientist with expertise in Marketing Mix Models, campaign optimization, and full-funnel marketing analytics. Outside work I chase alternative datasets — football, theme parks, prediction markets, and trend analysis across YouTube, TikTok and Reddit. Real-world events are the messiest, most interesting modeling problems there are.',
  lead:
    'Most data scientists hand their models off at the door. I started on the other side of that door.',
  body: [
    "Before the Python, the MMM models and the statistics, I was thinking in campaigns, briefs, creatives, channel strategy. Then a master's degree pulled me toward the science, and I realized I had something most people don't: I could see marketing the way a data scientist does, and data the way a marketer does.",
    'For eight years, six of them embedded inside marketing teams, I\'ve used that lens to optimize spend across channels, connect what the numbers say to what teams actually do, and drag insights all the way from "huh, interesting" to "let\'s ship it."',
  ],
  kicker: "The model isn't the work. Getting it used is the work.",
  social: {
    github: '[YOUR GITHUB URL]',
    linkedin: '[YOUR LINKEDIN URL]',
    instagram: '[YOUR INSTAGRAM URL]',
  },
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS. If `stackTags()[0]` is not `FastAPI`, check the counts — Python and FastAPI both appear three times, so alphabetical order breaks the tie in FastAPI's favour.

- [ ] **Step 6: Commit**

```bash
git add app/data/projects.ts app/data/about.ts app/data/projects.test.ts
git commit -m "Add projects and about content dictionaries"
```

---

## Task 6: Posts data layer

**Files:**
- Create: `posts/` with two sample files
- Create: `app/data/posts.ts`
- Test: `app/data/posts.test.ts`
- Create: `test/fixtures/posts/` with three fixture files

- [ ] **Step 1: Create the test fixtures**

Create `test/fixtures/posts/2026-08-14-second.md`:

```markdown
---
title:   "The second post"
hook:    "Newer, so it sorts first."
date:    2026-08-14
minutes: 7
tags:    [mmm]
image:   ""
---

Body of the second post.

## A heading

- a list item
```

Create `test/fixtures/posts/2026-01-05-first.md`:

```markdown
---
title:   "The first post"
hook:    "Older, so it sorts last."
date:    2026-01-05
minutes: 3
tags:    [football, data]
image:   ""
---

Body of the first post.
```

Create `test/fixtures/posts/not-markdown.txt`:

```
This file must be ignored by the loader.
```

- [ ] **Step 2: Write the failing test**

Create `app/data/posts.test.ts`:

```ts
import * as path from 'node:path'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { loadPosts } from './posts.ts'

const FIXTURES = path.resolve(import.meta.dirname, '../../test/fixtures/posts')

describe('loadPosts', () => {
  it('reads every markdown file and ignores everything else', () => {
    assert.equal(loadPosts(FIXTURES).length, 2)
  })

  it('sorts newest first', () => {
    let [newest, oldest] = loadPosts(FIXTURES)
    assert.equal(newest!.title, 'The second post')
    assert.equal(oldest!.title, 'The first post')
  })

  it('derives the slug from the filename stem', () => {
    assert.equal(loadPosts(FIXTURES)[0]!.slug, '2026-08-14-second')
  })

  it('exposes the formatted date and the source filename', () => {
    let post = loadPosts(FIXTURES)[0]!
    assert.equal(post.displayDate, 'AUG 14 2026')
    assert.equal(post.sourceFile, 'posts/2026-08-14-second.md')
  })

  it('lexes the body into block tokens with no space tokens', () => {
    let post = loadPosts(FIXTURES)[0]!
    assert.equal(post.tokens.length > 0, true)
    assert.equal(post.tokens.some((token) => token.type === 'space'), false)
    assert.equal(post.tokens.some((token) => token.type === 'heading'), true)
  })

  it('builds a table of contents from the headings', () => {
    let post = loadPosts(FIXTURES)[0]!
    assert.deepEqual(post.contents, [{ id: 'a-heading', label: 'A heading', depth: 2 }])
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./posts.ts`.

- [ ] **Step 4: Write the implementation**

Create `app/data/posts.ts`:

```ts
import * as fs from 'node:fs'
import * as path from 'node:path'

import { marked, type Token } from 'marked'

import { formatPostDate } from '../utils/dates.ts'
import { parseFrontMatter } from '../utils/front-matter.ts'

export interface TocEntry {
  id: string
  label: string
  depth: number
}

export interface Post {
  slug: string
  title: string
  hook: string
  /** ISO YYYY-MM-DD, used for sorting. */
  date: string
  /** `AUG 14 2026`, used for display. */
  displayDate: string
  minutes: number
  tags: string[]
  image: string
  /** `posts/<file>.md`, shown in the meta row. */
  sourceFile: string
  tokens: Token[]
  contents: TocEntry[]
}

const POSTS_DIR = path.resolve(process.cwd(), 'posts')
const isDevelopment = (process.env.NODE_ENV ?? 'development') === 'development'

/**
 * Read and parse every post in `directory`. Exported for testing against a
 * fixture directory; app code should use `allPosts()` / `findPost()`.
 */
export function loadPosts(directory: string): Post[] {
  if (!fs.existsSync(directory)) return []

  return fs
    .readdirSync(directory)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => readPost(directory, entry))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)))
}

function readPost(directory: string, filename: string): Post {
  let source = fs.readFileSync(path.join(directory, filename), 'utf8')
  let { frontMatter, body } = parseFrontMatter(source, filename)
  let tokens = marked.lexer(body).filter((token) => token.type !== 'space')

  return {
    slug: filename.replace(/\.md$/, ''),
    title: frontMatter.title,
    hook: frontMatter.hook,
    date: frontMatter.date,
    displayDate: formatPostDate(frontMatter.date),
    minutes: frontMatter.minutes,
    tags: frontMatter.tags,
    image: frontMatter.image,
    sourceFile: `posts/${filename}`,
    tokens,
    contents: buildContents(tokens),
  }
}

function buildContents(tokens: Token[]): TocEntry[] {
  let entries: TocEntry[] = []
  for (let token of tokens) {
    if (token.type !== 'heading') continue
    let heading = token as Token & { depth: number; text: string }
    if (heading.depth !== 2 && heading.depth !== 3) continue
    entries.push({ id: headingId(heading.text), label: heading.text, depth: heading.depth })
  }
  return entries
}

/** Stable anchor id for a heading, matched by ArticleBody. */
export function headingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

let cache: Post[] | null = null
let cacheStamp = ''

/** Directory mtime plus every file mtime, so edits and additions both show up. */
function stamp(): string {
  if (!fs.existsSync(POSTS_DIR)) return 'missing'
  let parts = [String(fs.statSync(POSTS_DIR).mtimeMs)]
  for (let entry of fs.readdirSync(POSTS_DIR).filter((name) => name.endsWith('.md'))) {
    parts.push(entry, String(fs.statSync(path.join(POSTS_DIR, entry)).mtimeMs))
  }
  return parts.join('|')
}

export function allPosts(): Post[] {
  if (isDevelopment) {
    let current = stamp()
    if (cache === null || current !== cacheStamp) {
      cache = loadPosts(POSTS_DIR)
      cacheStamp = current
    }
    return cache
  }

  cache ??= loadPosts(POSTS_DIR)
  return cache
}

export function findPost(slug: string): Post | undefined {
  return allPosts().find((post) => post.slug === slug)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 6 assertions in `posts.test.ts`.

- [ ] **Step 6: Create the two sample posts**

Create `posts/2026-08-14-sample-post.md`:

```markdown
---
title:   "[Title — up to about 60 characters]"
hook:    "[Hook — one sentence, about 140 characters, on what the reader walks away with.]"
date:    2026-08-14
minutes: 7
tags:    [sample]
image:   ""
---

This is a sample post so the writing pages have something to render. Delete it
when you write the real thing.

## [Section heading]

Body copy renders at 17px on a 1.75 line height, capped at 68 characters, with
inline [links](https://example.com), **bold text**, and `inline code`.

- Unordered list items keep the same rhythm as body copy.
- Markers sit in the gutter so the text edge stays straight.

> The model isn't the work. Getting it used is the work.

### [Sub-heading]

1. Numbered steps for anything procedural.
2. They inherit the same spacing as the unordered list.

```python
import pandas as pd

spend = pd.read_parquet("spend.parquet")
weekly = spend.groupby(["week", "channel"])["cost"].sum()
```
```

Create `posts/2026-06-02-second-sample.md` with the same front-matter shape,
`date: 2026-06-02`, `minutes: 4`, `tags: [sample]`, and two short paragraphs of
body text. Both files are marked samples and are meant to be deleted.

- [ ] **Step 7: Verify the app can see them**

Run: `node --import remix/node-tsx -e "import('./app/data/posts.ts').then(m => console.log(m.allPosts().map(p => p.slug)))"`
Expected: both sample slugs, newest first.

- [ ] **Step 8: Commit**

```bash
git add app/data/posts.ts app/data/posts.test.ts test/fixtures/posts posts
git commit -m "Add markdown post loader with sample posts"
```

---

## Task 7: Theme tokens and icons

**Files:**
- Create: `app/ui/theme.ts`
- Create: `app/ui/icons.tsx`
- Test: `app/ui/theme.test.ts`

The token values are lifted from the `<helmet>` block of any artboard in `design/`; every artboard carries the identical block.

- [ ] **Step 1: Write the failing test**

Create `app/ui/theme.test.ts`:

```ts
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { themeTokens } from './theme.ts'

describe('themeTokens', () => {
  it('defines the light palette on the element itself', () => {
    assert.equal(themeTokens['--paper'], 'oklch(0.973 0.006 85)')
    assert.equal(themeTokens['--accent'], 'oklch(0.575 0.155 42)')
  })

  it('overrides every token in dark mode', () => {
    let dark = themeTokens['&[data-theme="dark"]'] as Record<string, string>
    let lightKeys = Object.keys(themeTokens).filter((key) => key.startsWith('--'))
    for (let key of lightKeys) assert.equal(typeof dark[key], 'string')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./theme.ts`.

- [ ] **Step 3: Write the tokens**

Create `app/ui/theme.ts`:

```ts
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
export const FONT_SANS = "'IBM Plex Sans', system-ui, sans-serif"

export const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap'

/**
 * Applied once, to <html>, so `data-theme` on the same element flips the
 * whole palette. Lifted from the helmet block in design/*.dc.html.
 */
export const themeTokens: Record<string, unknown> = {
  '--paper': 'oklch(0.973 0.006 85)',
  '--paper-2': 'oklch(0.958 0.008 82)',
  '--ink': 'oklch(0.245 0.012 62)',
  '--ink-2': 'oklch(0.455 0.010 68)',
  '--ink-3': 'oklch(0.615 0.008 72)',
  '--rule': 'oklch(0.885 0.008 80)',
  '--rule-2': 'oklch(0.815 0.010 78)',
  '--accent': 'oklch(0.575 0.155 42)',
  '--accent-wash': 'oklch(0.575 0.155 42 / 0.10)',
  '--on-accent': 'oklch(0.985 0.004 85)',
  colorScheme: 'light',

  '&[data-theme="dark"]': {
    '--paper': 'oklch(0.178 0.008 70)',
    '--paper-2': 'oklch(0.224 0.009 70)',
    '--ink': 'oklch(0.925 0.006 85)',
    '--ink-2': 'oklch(0.735 0.008 78)',
    '--ink-3': 'oklch(0.575 0.008 74)',
    '--rule': 'oklch(0.302 0.010 72)',
    '--rule-2': 'oklch(0.382 0.012 72)',
    '--accent': 'oklch(0.740 0.145 55)',
    '--accent-wash': 'oklch(0.740 0.145 55 / 0.14)',
    '--on-accent': 'oklch(0.178 0.008 70)',
    colorScheme: 'dark',
  },
}

/** Base page styles, applied to <body>. */
export const pageBase = {
  margin: 0,
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontFamily: FONT_MONO,
  fontSize: '14px',
  lineHeight: 1.5,
  WebkitFontSmoothing: 'antialiased',
  '& *, & *::before, & *::after': { boxSizing: 'border-box' },
  '& a': { color: 'var(--accent)', textDecoration: 'none' },
}

/** Shared card/link hover recipe used by both card components. */
export const CARD_TRANSITION = 'border-color 160ms ease, transform 160ms ease'
```

- [ ] **Step 4: Write the icons**

Create `app/ui/icons.tsx`:

```tsx
import type { Handle } from 'remix/ui'

interface IconProps {
  size?: number
}

/** Diagonal arrow — "opens elsewhere". */
export function ArrowOut(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 13}
      height={handle.props.size ?? 13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

/** Rightward arrow — "more of this, same site". */
export function ArrowRight(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 13}
      height={handle.props.size ?? 13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export function ArrowBack(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 13}
      height={handle.props.size ?? 13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H6" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  )
}

export function Moon(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 12}
      height={handle.props.size ?? 12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}

export function GitHub(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 15}
      height={handle.props.size ?? 15}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.4 4.7-4.6 4.9.3.3.7 1 .7 2v3c0 .3.2.6.7.5A10.2 10.2 0 0 0 12 1.8Z" />
    </svg>
  )
}

export function LinkedIn(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 15}
      height={handle.props.size ?? 15}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4v11H3v-11Zm6.5 0h3.8v1.5h.06a4.2 4.2 0 0 1 3.78-2c4 0 4.76 2.6 4.76 6v5.5h-4v-4.9c0-1.2 0-2.7-1.7-2.7s-1.96 1.3-1.96 2.6v5h-4v-11Z" />
    </svg>
  )
}

export function Instagram(handle: Handle<IconProps>) {
  return () => (
    <svg
      width={handle.props.size ?? 15}
      height={handle.props.size ?? 15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/ui/theme.ts app/ui/theme.test.ts app/ui/icons.tsx
git commit -m "Add theme tokens and inline SVG icon set"
```

---

## Task 8: Shell

**Files:**
- Create: `app/ui/shell.tsx`
- Modify: `app/actions/document.tsx`
- Test: covered by the controller tests in Tasks 13-15

`Shell` owns the document, the header with nav, and the footer. The `section` prop marks which nav item is current.

- [ ] **Step 1: Replace the document**

Replace `app/actions/document.tsx` entirely:

```tsx
import type { Handle, RemixNode } from 'remix/ui'
import { css } from 'remix/ui'

import { entryHref, entryPreloads } from '../assets.ts'
import { FONTS_HREF, pageBase, themeTokens } from '../ui/theme.ts'

export interface DocumentProps {
  children?: RemixNode
  title?: string
  description?: string
}

/**
 * Applies the stored theme before first paint so there is no flash. Runs
 * inline in <head>, before <body> exists, so it writes to documentElement.
 */
const NO_FLASH = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let { children, title = 'Gerardo Martinez', description } = handle.props

    return (
      <html lang="en" data-theme="light" mix={css(themeTokens)}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          {description ? <meta name="description" content={description} /> : null}
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={FONTS_HREF} />
          <script>{NO_FLASH}</script>
          {entryPreloads.map((href) => (
            <link key={href} rel="modulepreload" href={href} />
          ))}
          <script type="module" src={entryHref}></script>
        </head>
        <body mix={css(pageBase)}>{children}</body>
      </html>
    )
  }
}
```

- [ ] **Step 2: Write the shell**

Create `app/ui/shell.tsx`:

```tsx
import { css, type Handle, type RemixNode } from 'remix/ui'

import { Document } from '../actions/document.tsx'
import { routes } from '../routes.ts'
import { MobileMenu } from '../actions/public/mobile-menu.tsx'
import { ThemeToggle } from '../actions/public/theme-toggle.tsx'

export type Section = 'index' | 'projects' | 'writing'

export interface ShellProps {
  section: Section
  title?: string
  description?: string
  /** Article pages swap the nav for a back link. */
  backTo?: { href: string; label: string }
  children?: RemixNode
}

const NAV = [
  { key: 'index' as const, label: 'index', href: routes.home.href() },
  { key: 'projects' as const, label: 'projects', href: routes.projects.index.href() },
  { key: 'writing' as const, label: 'writing', href: routes.writing.index.href() },
]

export function Shell(handle: Handle<ShellProps>) {
  return () => {
    let { section, title, description, backTo, children } = handle.props

    return (
      <Document title={title} description={description}>
        <header
          mix={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            padding: '20px 48px',
            borderBottom: '1px solid var(--rule)',
            background: 'var(--paper)',
            '@media (max-width: 720px)': { padding: '12px 20px' },
          })}
        >
          <a
            href={routes.home.href()}
            mix={css({
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              color: 'var(--ink)',
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.01em',
            })}
          >
            <span mix={css({ color: 'var(--accent)', fontWeight: 600 })}>~/</span>
            <span>gerardo-martinez</span>
            {section === 'index' ? null : (
              <span mix={css({ color: 'var(--ink-3)' })}>/ {section}</span>
            )}
            <span
              mix={css({
                display: 'inline-block',
                width: '7px',
                height: '15px',
                background: 'var(--accent)',
                animation: 'caret 1.15s steps(1, end) infinite',
                '@keyframes caret': {
                  '0%, 50%': { opacity: 1 },
                  '50.01%, 100%': { opacity: 0 },
                },
              })}
            />
          </a>

          <nav
            mix={css({
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              '@media (max-width: 720px)': { display: 'none' },
            })}
          >
            {backTo ? (
              <a
                href={backTo.href}
                mix={css({
                  color: 'var(--ink-2)',
                  fontSize: '12px',
                  letterSpacing: '0.09em',
                  '&:hover': { color: 'var(--ink)' },
                })}
              >
                {backTo.label}
              </a>
            ) : (
              NAV.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  mix={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    letterSpacing: '0.09em',
                    color: item.key === section ? 'var(--ink)' : 'var(--ink-2)',
                    '&:hover': { color: 'var(--ink)' },
                  })}
                >
                  {item.key === section ? (
                    <span
                      mix={css({ width: '6px', height: '6px', background: 'var(--accent)' })}
                    />
                  ) : null}
                  <span>{item.label}</span>
                </a>
              ))
            )}
            <ThemeToggle />
          </nav>

          <MobileMenu section={section} />
        </header>

        <main>{children}</main>

        <footer mix={css({ padding: '0 48px 56px', '@media (max-width: 720px)': { padding: '0 20px 40px' } })}>
          <div
            mix={css({
              maxWidth: '1080px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              paddingTop: '22px',
              borderTop: '1px solid var(--rule)',
              fontSize: '10.5px',
              letterSpacing: '0.08em',
              color: 'var(--ink-3)',
            })}
          >
            <span>gerardomarr.com</span>
            <span>© 2026 Gerardo Martinez</span>
          </div>
        </footer>
      </Document>
    )
  }
}
```

- [ ] **Step 3: Note the dependency**

`Shell` imports `ThemeToggle` and `MobileMenu`, which are created in Task 16. Until then the build fails. Create both files now as non-interactive stubs so every intermediate task compiles — Task 16 replaces their bodies with the real hydrated versions.

Create `app/actions/public/theme-toggle.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

export function ThemeToggle(_handle: Handle) {
  return () => <span mix={css({ display: 'none' })} data-theme-toggle-placeholder="" />
}
```

Create `app/actions/public/mobile-menu.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

import type { Section } from '../../ui/shell.tsx'

export function MobileMenu(_handle: Handle<{ section: Section }>) {
  return () => <span mix={css({ display: 'none' })} data-mobile-menu-placeholder="" />
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/ui/shell.tsx app/actions/document.tsx app/actions/public
git commit -m "Add page shell, document, and client-entry stubs"
```

---

## Task 9: Thumbnail

**Files:**
- Create: `app/ui/thumbnail.tsx`

Four motifs, each its own `<svg>`. Aspect ratio is 16/10 everywhere and `preserveAspectRatio` is left at its default so circles stay circular.

- [ ] **Step 1: Write the component**

Create `app/ui/thumbnail.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

import type { Project } from '../data/projects.ts'
import { areaPath, barsPath, cellsPath, lastPoint, linePath } from '../utils/thumbnails.ts'

const PAD = 28

export function Thumbnail(handle: Handle<{ project: Project }>) {
  return () => {
    let { project } = handle.props

    return (
      <div
        mix={css({
          position: 'relative',
          aspectRatio: '16 / 10',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper)',
        })}
      >
        {renderMotif(project)}
        <span
          mix={css({
            position: 'absolute',
            top: '12px',
            left: '14px',
            fontSize: '9.5px',
            letterSpacing: '0.16em',
            color: 'var(--ink-3)',
          })}
        >
          {project.kindLabel}
        </span>
      </div>
    )
  }
}

function svgProps() {
  return {
    viewBox: '0 0 320 200',
    width: '100%',
    height: '100%',
    'aria-hidden': 'true' as const,
  }
}

function renderMotif(project: Project) {
  if (project.kind === 'pitch') {
    return (
      <svg {...svgProps()} mix={css({ display: 'block' })}>
        <rect x="28" y="26" width="264" height="148" fill="none" stroke="var(--rule-2)" />
        <path d="M160 26 L160 174" stroke="var(--rule-2)" />
        <circle cx="160" cy="100" r="28" fill="none" stroke="var(--rule-2)" />
        <rect x="28" y="64" width="30" height="72" fill="none" stroke="var(--rule-2)" />
        <rect x="262" y="64" width="30" height="72" fill="none" stroke="var(--rule-2)" />
        <path
          d="M52 148 L96 112 L138 132 L176 88 L214 104 L262 68"
          fill="none"
          stroke="var(--accent)"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
        <g fill="var(--accent)">
          <circle cx="52" cy="148" r="3.2" />
          <circle cx="96" cy="112" r="3.2" />
          <circle cx="138" cy="132" r="3.2" />
          <circle cx="176" cy="88" r="3.2" />
          <circle cx="214" cy="104" r="3.2" />
          <circle cx="262" cy="68" r="4.6" />
        </g>
      </svg>
    )
  }

  if (project.kind === 'bars') {
    return (
      <svg {...svgProps()} mix={css({ display: 'block' })}>
        <path d="M28 172 L292 172" stroke="var(--rule-2)" />
        <path d="M28 100 L292 100" stroke="var(--rule-2)" stroke-dasharray="2 5" />
        <path d={barsPath(project.series, PAD, 6)} fill="var(--accent)" opacity="0.85" />
      </svg>
    )
  }

  if (project.kind === 'line') {
    let end = lastPoint(project.series, PAD)
    return (
      <svg {...svgProps()} mix={css({ display: 'block' })}>
        <path d="M28 172 L292 172" stroke="var(--rule-2)" />
        <path
          d="M28 128 L292 128 M28 84 L292 84 M28 40 L292 40"
          stroke="var(--rule-2)"
          stroke-dasharray="2 5"
        />
        <path d={areaPath(project.series, PAD)} fill="var(--accent)" opacity="0.14" />
        <path
          d={linePath(project.series, PAD)}
          fill="none"
          stroke="var(--accent)"
          stroke-width="1.9"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <circle cx={end.x} cy={end.y} r="4.6" fill="var(--accent)" />
      </svg>
    )
  }

  return (
    <svg {...svgProps()} mix={css({ display: 'block' })}>
      <path d={cellsPath(8, 5, PAD, null)} fill="none" stroke="var(--rule-2)" />
      <path d={cellsPath(8, 5, PAD, project.series)} fill="var(--accent)" opacity="0.85" />
    </svg>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/ui/thumbnail.tsx
git commit -m "Add project thumbnail motifs"
```

---

## Task 10: Section rule and project card

**Files:**
- Create: `app/ui/section-rule.tsx`
- Create: `app/ui/project-card.tsx`

- [ ] **Step 1: Write the section rule**

Create `app/ui/section-rule.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

export interface SectionRuleProps {
  /** Two-digit ordinal, e.g. "01". Omit for an unnumbered rule. */
  number?: string
  label: string
  /** Optional right-hand text, e.g. "04 / 04". */
  trailing?: string
}

export function SectionRule(handle: Handle<SectionRuleProps>) {
  return () => {
    let { number, label, trailing } = handle.props

    return (
      <div mix={css({ display: 'flex', alignItems: 'center', gap: '16px' })}>
        {number ? (
          <span
            mix={css({
              color: 'var(--accent)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.1em',
            })}
          >
            {number}
          </span>
        ) : null}
        <span
          mix={css({
            color: 'var(--ink-3)',
            fontSize: '11.5px',
            fontWeight: 600,
            letterSpacing: '0.2em',
          })}
        >
          {number ? null : label}
        </span>
        <span mix={css({ flexGrow: 1, height: '1px', background: 'var(--rule)' })} />
        {number ? (
          <span
            mix={css({
              color: 'var(--ink-3)',
              fontSize: '11.5px',
              fontWeight: 600,
              letterSpacing: '0.2em',
            })}
          >
            {label}
          </span>
        ) : null}
        {trailing ? (
          <span
            mix={css({ color: 'var(--ink-3)', fontSize: '11.5px', letterSpacing: '0.1em' })}
          >
            {trailing}
          </span>
        ) : null}
      </div>
    )
  }
}
```

- [ ] **Step 2: Write the project card**

Create `app/ui/project-card.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

import type { Project } from '../data/projects.ts'
import { ArrowOut } from './icons.tsx'
import { CARD_TRANSITION } from './theme.ts'
import { Thumbnail } from './thumbnail.tsx'

/** `index` is the 2-up projects grid; `home` is the 3-up home grid. */
export type ProjectCardVariant = 'index' | 'home'

const SIZES = {
  index: { padding: '22px 22px 24px', name: '18px', host: '11px', blurb: '13px', blurbLine: 1.68, tag: '4px 8px' },
  home: { padding: '18px 18px 20px', name: '15px', host: '10.5px', blurb: '12.5px', blurbLine: 1.6, tag: '3px 7px' },
} as const

export function ProjectCard(handle: Handle<{ project: Project; variant?: ProjectCardVariant }>) {
  return () => {
    let { project, variant = 'index' } = handle.props
    let size = SIZES[variant]

    return (
      <a
        href={project.url}
        mix={css({
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--rule)',
          background: 'var(--paper-2)',
          transition: CARD_TRANSITION,
          '&:hover': { borderColor: 'var(--accent)', transform: 'translateY(-3px)' },
          '&:hover .card-name': { color: 'var(--accent)' },
          '&:hover .card-go': { transform: 'translate(2px, -2px)' },
        })}
      >
        <Thumbnail project={project} />
        <div
          mix={css({
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: size.padding,
          })}
        >
          <div
            mix={css({
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '12px',
            })}
          >
            <span
              class="card-name"
              mix={css({
                fontSize: size.name,
                fontWeight: 600,
                letterSpacing: '-0.012em',
                color: 'var(--ink)',
                transition: 'color 160ms ease',
              })}
            >
              {project.name}
            </span>
            <span
              class="card-go"
              mix={css({
                display: 'inline-flex',
                color: 'var(--accent)',
                transition: 'transform 160ms ease',
              })}
            >
              <ArrowOut size={variant === 'index' ? 14 : 13} />
            </span>
          </div>

          <span
            mix={css({ fontSize: size.host, letterSpacing: '0.04em', color: 'var(--ink-3)' })}
          >
            {project.host}
          </span>

          <p
            mix={css({
              margin: 0,
              fontSize: size.blurb,
              lineHeight: size.blurbLine,
              color: 'var(--ink-2)',
              textWrap: 'pretty',
            })}
          >
            {project.blurb}
          </p>

          <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' })}>
            {project.tech.map((tag) => (
              <span
                key={tag}
                mix={css({
                  padding: size.tag,
                  border: '1px solid var(--rule-2)',
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-2)',
                })}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
    )
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/ui/section-rule.tsx app/ui/project-card.tsx
git commit -m "Add section rule and project card components"
```

---

## Task 11: Post card

**Files:**
- Create: `app/ui/post-card.tsx`

Three variants. The plate is a hatched field carrying the post's index; four hatch angles cycle so a list does not look repetitive. A post with an `image` uses it instead.

- [ ] **Step 1: Write the component**

Create `app/ui/post-card.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

import type { Post } from '../data/posts.ts'
import { routes } from '../routes.ts'
import { ArrowOut } from './icons.tsx'

export type PostCardVariant = 'featured' | 'row' | 'compact'

const HATCH_ANGLES = ['135deg', '45deg', '90deg', '0deg']

function plateStyle(index: number, image: string) {
  if (image) {
    return {
      backgroundImage: `url(${image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  let angle = HATCH_ANGLES[index % HATCH_ANGLES.length]
  return {
    backgroundImage: `repeating-linear-gradient(${angle}, var(--accent-wash) 0 2px, transparent 2px 9px)`,
  }
}

function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function PostCard(
  handle: Handle<{ post: Post; index: number; variant?: PostCardVariant }>,
) {
  return () => {
    let { post, index, variant = 'row' } = handle.props
    let href = routes.writing.post.href({ slug: post.slug })

    let meta = (
      <div
        mix={css({
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '10.5px',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
        })}
      >
        <span>{post.displayDate}</span>
        <span mix={css({ width: '3px', height: '3px', background: 'var(--rule-2)' })} />
        <span>{post.minutes} MIN</span>
        {variant === 'compact' ? null : (
          <>
            <span mix={css({ width: '3px', height: '3px', background: 'var(--rule-2)' })} />
            <span>{post.sourceFile}</span>
          </>
        )}
      </div>
    )

    if (variant === 'featured') {
      return (
        <a
          href={href}
          mix={css({
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)',
            border: '1px solid var(--rule)',
            background: 'var(--paper-2)',
            transition: 'border-color 160ms ease',
            '&:hover': { borderColor: 'var(--accent)' },
            '&:hover .post-title': { color: 'var(--accent)' },
            '&:hover .post-go': { transform: 'translate(2px, -2px)' },
            '@media (max-width: 860px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
          })}
        >
          <div
            mix={css({
              position: 'relative',
              aspectRatio: '4 / 3',
              background: 'var(--paper)',
              borderRight: '1px solid var(--rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...plateStyle(index, post.image),
            })}
          >
            {post.image ? null : (
              <span
                mix={css({
                  fontSize: '96px',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: 'var(--paper)',
                  WebkitTextStroke: '1.5px var(--accent)',
                })}
              >
                {ordinal(index)}
              </span>
            )}
            <span
              mix={css({
                position: 'absolute',
                top: '14px',
                left: '16px',
                fontSize: '9.5px',
                letterSpacing: '0.16em',
                color: 'var(--ink-3)',
              })}
            >
              LATEST
            </span>
          </div>

          <div
            mix={css({
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              padding: '40px',
            })}
          >
            {meta}
            <span
              class="post-title"
              mix={css({
                fontSize: '32px',
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.022em',
                color: 'var(--ink)',
                transition: 'color 160ms ease',
                textWrap: 'balance',
              })}
            >
              {post.title}
            </span>
            <p
              mix={css({
                margin: 0,
                fontSize: '14.5px',
                lineHeight: 1.7,
                color: 'var(--ink-2)',
                textWrap: 'pretty',
              })}
            >
              {post.hook}
            </p>
            <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px' })}>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  mix={css({
                    padding: '4px 8px',
                    border: '1px solid var(--rule-2)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    color: 'var(--ink-2)',
                  })}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div
              mix={css({
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                marginTop: 'auto',
                paddingTop: '16px',
                color: 'var(--accent)',
                fontSize: '12px',
                letterSpacing: '0.09em',
              })}
            >
              <span>read the piece</span>
              <span
                class="post-go"
                mix={css({ display: 'inline-flex', transition: 'transform 160ms ease' })}
              >
                <ArrowOut size={14} />
              </span>
            </div>
          </div>
        </a>
      )
    }

    let compact = variant === 'compact'

    return (
      <a
        href={href}
        mix={css({
          display: 'grid',
          gridTemplateColumns: compact ? '92px minmax(0, 1fr)' : '208px minmax(0, 1fr) auto',
          gap: compact ? '16px' : '28px',
          alignItems: 'start',
          padding: compact ? '18px 0' : '26px 0',
          borderTop: '1px solid var(--rule)',
          '&:hover .post-title': { color: 'var(--accent)' },
          '&:hover .post-go': { transform: 'translate(2px, -2px)' },
          '&:hover .post-plate': { borderColor: 'var(--accent)' },
          '@media (max-width: 720px)': { gridTemplateColumns: '92px minmax(0, 1fr)', gap: '16px' },
        })}
      >
        <div
          class="post-plate"
          mix={css({
            aspectRatio: compact ? '1 / 1' : '16 / 10',
            border: '1px solid var(--rule)',
            background: 'var(--paper-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 160ms ease',
            ...plateStyle(index, post.image),
          })}
        >
          {post.image ? null : (
            <span
              mix={css({
                fontSize: compact ? '28px' : '42px',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: 'var(--paper)',
                WebkitTextStroke: '1px var(--accent)',
              })}
            >
              {ordinal(index)}
            </span>
          )}
        </div>

        <div
          mix={css({
            display: 'flex',
            flexDirection: 'column',
            gap: compact ? '8px' : '11px',
            paddingTop: compact ? 0 : '4px',
          })}
        >
          {meta}
          <span
            class="post-title"
            mix={css({
              fontSize: compact ? '16px' : '21px',
              fontWeight: 600,
              lineHeight: compact ? 1.3 : 1.35,
              letterSpacing: '-0.015em',
              color: 'var(--ink)',
              transition: 'color 160ms ease',
            })}
          >
            {post.title}
          </span>
          <p
            mix={css({
              margin: 0,
              maxWidth: '62ch',
              fontSize: compact ? '12.5px' : '13.5px',
              lineHeight: compact ? 1.6 : 1.65,
              color: 'var(--ink-2)',
              textWrap: 'pretty',
            })}
          >
            {post.hook}
          </p>
        </div>

        {compact ? null : (
          <div
            mix={css({
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '8px',
              color: 'var(--accent)',
              fontSize: '11.5px',
              letterSpacing: '0.09em',
              '@media (max-width: 720px)': { display: 'none' },
            })}
          >
            <span>read</span>
            <span
              class="post-go"
              mix={css({ display: 'inline-flex', transition: 'transform 160ms ease' })}
            >
              <ArrowOut />
            </span>
          </div>
        )}
      </a>
    )
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/ui/post-card.tsx
git commit -m "Add post card component with three variants"
```

---

## Task 12: Article body

**Files:**
- Create: `app/ui/article-body.tsx`
- Test: `app/ui/article-body.test.ts`

Maps `marked` block tokens to styled elements. Remember the verified quirk: **list items nest one level deeper** — `list.items[i].tokens` is `[{ type: 'text', tokens: [...inline] }]`.

- [ ] **Step 1: Write the failing test**

Create `app/ui/article-body.test.ts`:

```ts
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { marked } from 'marked'

import { inlineTokensOf } from './article-body.ts'

describe('inlineTokensOf', () => {
  it('unwraps the extra text layer inside a list item', () => {
    let list = marked.lexer('- an item with `code`\n').find((t) => t.type === 'list') as any
    let inline = inlineTokensOf(list.items[0])
    assert.equal(inline.some((token) => token.type === 'codespan'), true)
  })

  it('returns inline tokens of a paragraph unchanged', () => {
    let para = marked.lexer('plain **bold** text').find((t) => t.type === 'paragraph') as any
    assert.equal(inlineTokensOf(para).some((token) => token.type === 'strong'), true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `./article-body.ts`.

- [ ] **Step 3: Write the component**

Create `app/ui/article-body.tsx`:

```tsx
import { css, type Handle, type RemixNode } from 'remix/ui'
import type { Token } from 'marked'

import { FONT_MONO, FONT_SANS } from './theme.ts'

/**
 * Inline tokens for a block. List items wrap their inline content in an extra
 * `text` token, so descend one level when that is what we are given.
 */
export function inlineTokensOf(token: any): any[] {
  let tokens: any[] = token?.tokens ?? []
  if (tokens.length === 1 && tokens[0]?.type === 'text' && Array.isArray(tokens[0]?.tokens)) {
    return tokens[0].tokens
  }
  return tokens
}

function inline(tokens: any[]): RemixNode[] {
  return tokens.map((token, i) => {
    switch (token.type) {
      case 'strong':
        return (
          <strong key={i} mix={css({ color: 'var(--ink)', fontWeight: 600 })}>
            {inline(token.tokens ?? [])}
          </strong>
        )
      case 'em':
        return <em key={i}>{inline(token.tokens ?? [])}</em>
      case 'codespan':
        return (
          <code
            key={i}
            mix={css({
              fontFamily: FONT_MONO,
              fontSize: '14.5px',
              padding: '2px 6px',
              background: 'var(--accent-wash)',
              color: 'var(--ink)',
            })}
          >
            {token.text}
          </code>
        )
      case 'link':
        return (
          <a
            key={i}
            href={token.href}
            mix={css({
              borderBottom: '1px solid var(--accent)',
              transition: 'color 140ms ease',
              '&:hover': { color: 'var(--ink)' },
            })}
          >
            {inline(token.tokens ?? [])}
          </a>
        )
      case 'image':
        return (
          <img
            key={i}
            src={token.href}
            alt={token.text ?? ''}
            mix={css({ maxWidth: '100%', height: 'auto', border: '1px solid var(--rule)' })}
          />
        )
      case 'br':
        return <br key={i} />
      default:
        return token.text ?? ''
    }
  })
}

const HEADING_2 = {
  margin: '20px 0 0',
  fontFamily: FONT_MONO,
  fontSize: '22px',
  lineHeight: 1.3,
  letterSpacing: '-0.015em',
  fontWeight: 600,
  color: 'var(--ink)',
}

const HEADING_3 = {
  margin: '16px 0 0',
  fontFamily: FONT_MONO,
  fontSize: '16px',
  lineHeight: 1.4,
  letterSpacing: '0.02em',
  fontWeight: 600,
  color: 'var(--ink)',
}

function block(token: any, key: number): RemixNode {
  switch (token.type) {
    case 'heading': {
      // posts.ts assigns this at parse time, de-duplicated per post. Do NOT
      // recompute it here — the contents list links to these exact ids, and
      // two independent passes would disagree the moment dedupe kicks in.
      let id = token.id
      if (token.depth <= 2) {
        return <h2 key={key} id={id} mix={css(HEADING_2)}>{inline(token.tokens ?? [])}</h2>
      }
      return <h3 key={key} id={id} mix={css(HEADING_3)}>{inline(token.tokens ?? [])}</h3>
    }

    case 'paragraph':
      return (
        <p key={key} mix={css({ margin: 0, textWrap: 'pretty' })}>
          {inline(token.tokens ?? [])}
        </p>
      )

    case 'list': {
      let items = token.items.map((item: any, i: number) => (
        <li key={i}>{inline(inlineTokensOf(item))}</li>
      ))
      let listStyle = {
        margin: 0,
        paddingLeft: token.ordered ? '24px' : '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }
      return token.ordered ? (
        <ol key={key} mix={css(listStyle)}>{items}</ol>
      ) : (
        <ul key={key} mix={css(listStyle)}>{items}</ul>
      )
    }

    case 'blockquote':
      return (
        <blockquote
          key={key}
          mix={css({
            margin: '12px 0',
            padding: '0 0 0 26px',
            borderLeft: '2px solid var(--accent)',
            fontFamily: FONT_MONO,
            fontSize: '19px',
            lineHeight: 1.55,
            color: 'var(--ink)',
          })}
        >
          {(token.tokens ?? []).map((child: any, i: number) => block(child, i))}
        </blockquote>
      )

    case 'code':
      return (
        <pre
          key={key}
          mix={css({
            margin: 0,
            padding: '20px 22px',
            background: 'var(--paper-2)',
            border: '1px solid var(--rule)',
            overflowX: 'auto',
            fontFamily: FONT_MONO,
            fontSize: '13.5px',
            lineHeight: 1.7,
            color: 'var(--ink)',
          })}
        >
          <code>{token.text}</code>
        </pre>
      )

    case 'hr':
      return (
        <div key={key} mix={css({ height: '1px', background: 'var(--rule)', margin: '20px 0' })} />
      )

    default:
      return null
  }
}

export function ArticleBody(handle: Handle<{ tokens: Token[] }>) {
  return () => (
    <article
      mix={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        fontFamily: FONT_SANS,
        fontSize: '17px',
        lineHeight: 1.75,
        color: 'var(--ink-2)',
        maxWidth: '68ch',
      })}
    >
      {handle.props.tokens.map((token, i) => block(token, i))}
    </article>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/ui/article-body.tsx app/ui/article-body.test.ts
git commit -m "Render markdown tokens as styled article body"
```

---

## Task 13: Home page

**Files:**
- Create: `app/actions/home-page.tsx` (replaces the scaffold's starter page)
- Modify: `app/actions/controller.tsx`
- Delete: `app/actions/public/prompt-button.tsx`
- Test: `app/actions/controller.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/actions/controller.test.tsx`:

```tsx
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { router } from '../router.ts'
import { routes } from '../routes.ts'

async function fetchPage(href: string) {
  let response = await router.fetch(new Request('http://localhost' + href))
  return { response, html: await response.text() }
}

describe('home', () => {
  it('responds 200', async () => {
    let { response } = await fetchPage(routes.home.href())
    assert.equal(response.status, 200)
  })

  it('introduces him', async () => {
    let { html } = await fetchPage(routes.home.href())
    assert.match(html, /Gerardo/)
    assert.match(html, /Marketing Mix Models/)
  })

  it('shows the three featured projects and not the fourth', async () => {
    let { html } = await fetchPage(routes.home.href())
    assert.match(html, /La Cancha/)
    assert.match(html, /Queue Scope/)
    assert.match(html, /Trending/)
    assert.equal(html.includes('Movies MX'), false)
  })

  it('links to the projects and writing sections', async () => {
    let { html } = await fetchPage(routes.home.href())
    assert.match(html, /href="\/projects"/)
    assert.match(html, /href="\/writing"/)
  })

  it('links to both recent posts', async () => {
    let { html } = await fetchPage(routes.home.href())
    assert.match(html, /href="\/writing\/2026-08-14-sample-post"/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — the scaffold page has none of this content.

- [ ] **Step 3: Write the home page**

Replace `app/actions/home-page.tsx` entirely:

```tsx
import { css, type Handle } from 'remix/ui'

import { ABOUT } from '../data/about.ts'
import { allPosts } from '../data/posts.ts'
import { featuredProjects } from '../data/projects.ts'
import { routes } from '../routes.ts'
import { ArrowRight, GitHub, Instagram, LinkedIn } from '../ui/icons.tsx'
import { PostCard } from '../ui/post-card.tsx'
import { ProjectCard } from '../ui/project-card.tsx'
import { SectionRule } from '../ui/section-rule.tsx'
import { Shell } from '../ui/shell.tsx'

const WRAP = { maxWidth: '1080px', margin: '0 auto' }
const SECTION = { padding: '0 48px 88px', '@media (max-width: 720px)': { padding: '0 20px 44px' } }

const SOCIALS = [
  { key: 'github', label: 'GitHub', handle: 'github.com/[handle]', Icon: GitHub },
  { key: 'linkedin', label: 'LinkedIn', handle: 'linkedin.com/in/[handle]', Icon: LinkedIn },
  { key: 'instagram', label: 'Instagram', handle: 'instagram.com/[handle]', Icon: Instagram },
] as const

export function HomePage(_handle: Handle) {
  return () => {
    let projects = featuredProjects()
    let posts = allPosts().slice(0, 2)

    return (
      <Shell section="index" title="Gerardo Martinez" description={ABOUT.intro}>
        {/* hero */}
        <section
          mix={css({
            padding: '96px 48px 80px',
            '@media (max-width: 720px)': { padding: '44px 20px 40px' },
          })}
        >
          <div mix={css({ ...WRAP, display: 'flex', flexDirection: 'column', gap: '34px' })}>
            <span mix={css({ color: 'var(--ink-3)', fontSize: '12px', letterSpacing: '0.16em' })}>
              $ whoami
            </span>
            <h1
              mix={css({
                margin: 0,
                fontSize: '76px',
                lineHeight: 0.98,
                letterSpacing: '-0.025em',
                fontWeight: 600,
                color: 'var(--ink)',
                '@media (max-width: 720px)': { fontSize: '42px' },
              })}
            >
              {ABOUT.name.split(' ')[0]}
              <br />
              {ABOUT.name.split(' ').slice(1).join(' ')}
            </h1>

            <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '8px' })}>
              {ABOUT.tagline.map((chip) => (
                <span
                  key={chip}
                  mix={css({
                    padding: '6px 11px',
                    border: '1px solid var(--rule-2)',
                    fontSize: '11.5px',
                    letterSpacing: '0.05em',
                    color: 'var(--ink-2)',
                  })}
                >
                  {chip}
                </span>
              ))}
            </div>

            <p
              mix={css({
                margin: 0,
                maxWidth: '68ch',
                fontSize: '15px',
                lineHeight: 1.75,
                color: 'var(--ink-2)',
                textWrap: 'pretty',
              })}
            >
              {ABOUT.intro}
            </p>

            <div mix={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '22px' })}>
              {SOCIALS.map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={ABOUT.social[key]}
                  mix={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--ink-2)',
                    fontSize: '12px',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--rule-2)',
                    transition: 'border-color 160ms ease',
                    '&:hover': { borderBottomColor: 'var(--accent)' },
                  })}
                >
                  <Icon />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 01 about */}
        <section mix={css({ ...SECTION, paddingTop: '24px' })}>
          <div mix={css({ ...WRAP, display: 'flex', flexDirection: 'column', gap: '36px' })}>
            <SectionRule number="01" label="ABOUT" />
            <div
              mix={css({
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.35fr)',
                gap: '56px',
                alignItems: 'start',
                '@media (max-width: 860px)': { gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' },
              })}
            >
              <p
                mix={css({
                  margin: 0,
                  fontSize: '23px',
                  lineHeight: 1.38,
                  letterSpacing: '-0.012em',
                  color: 'var(--ink)',
                  textWrap: 'pretty',
                })}
              >
                {ABOUT.lead}
              </p>
              <div mix={css({ display: 'flex', flexDirection: 'column', gap: '20px' })}>
                {ABOUT.body.map((paragraph, i) => (
                  <p
                    key={i}
                    mix={css({
                      margin: 0,
                      fontSize: '14.5px',
                      lineHeight: 1.78,
                      color: 'var(--ink-2)',
                      textWrap: 'pretty',
                    })}
                  >
                    {paragraph}
                  </p>
                ))}
                <div mix={css({ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '8px' })}>
                  <span mix={css({ color: 'var(--accent)', fontSize: '17px', fontWeight: 600 })}>
                    &gt;
                  </span>
                  <p
                    mix={css({
                      margin: 0,
                      fontSize: '17px',
                      lineHeight: 1.5,
                      color: 'var(--ink)',
                      fontWeight: 500,
                    })}
                  >
                    {ABOUT.kicker}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 projects */}
        <section mix={css(SECTION)}>
          <div mix={css({ ...WRAP, display: 'flex', flexDirection: 'column', gap: '32px' })}>
            <SectionRule number="02" label="SELECTED PROJECTS" />
            <div
              mix={css({
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '20px',
                '@media (max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
              })}
            >
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} variant="home" />
              ))}
            </div>
            <a
              href={routes.projects.index.href()}
              mix={css({
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                color: 'var(--ink)',
                fontSize: '12.5px',
                letterSpacing: '0.06em',
                paddingBottom: '2px',
                borderBottom: '1px solid var(--rule-2)',
                '&:hover': { borderBottomColor: 'var(--accent)' },
              })}
            >
              <span>See all projects</span>
              <span mix={css({ display: 'inline-flex', color: 'var(--accent)' })}>
                <ArrowRight />
              </span>
            </a>
          </div>
        </section>

        {/* 03 writing */}
        <section mix={css(SECTION)}>
          <div mix={css({ ...WRAP, display: 'flex', flexDirection: 'column', gap: '28px' })}>
            <SectionRule number="03" label="RECENT WRITING" />
            <div mix={css({ display: 'flex', flexDirection: 'column' })}>
              {posts.map((post, i) => (
                <PostCard key={post.slug} post={post} index={i} variant="row" />
              ))}
            </div>
            <a
              href={routes.writing.index.href()}
              mix={css({
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                color: 'var(--ink)',
                fontSize: '12.5px',
                letterSpacing: '0.06em',
                paddingBottom: '2px',
                borderBottom: '1px solid var(--rule-2)',
                '&:hover': { borderBottomColor: 'var(--accent)' },
              })}
            >
              <span>All writing</span>
              <span mix={css({ display: 'inline-flex', color: 'var(--accent)' })}>
                <ArrowRight />
              </span>
            </a>
          </div>
        </section>

        {/* 04 elsewhere */}
        <section mix={css(SECTION)}>
          <div mix={css({ ...WRAP, display: 'flex', flexDirection: 'column', gap: '32px' })}>
            <SectionRule number="04" label="ELSEWHERE" />
            <div
              mix={css({
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '20px',
                '@media (max-width: 860px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
              })}
            >
              {SOCIALS.map(({ key, label, handle: shown, Icon }) => (
                <a
                  key={key}
                  href={ABOUT.social[key]}
                  mix={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '20px',
                    border: '1px solid var(--rule)',
                    background: 'var(--paper-2)',
                    transition: 'border-color 160ms ease',
                    '&:hover': { borderColor: 'var(--accent)' },
                    '&:hover .social-name': { color: 'var(--accent)' },
                  })}
                >
                  <span mix={css({ display: 'inline-flex', color: 'var(--ink)' })}>
                    <Icon size={20} />
                  </span>
                  <div mix={css({ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 })}>
                    <span
                      class="social-name"
                      mix={css({
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--ink)',
                        transition: 'color 160ms ease',
                      })}
                    >
                      {label}
                    </span>
                    <span
                      mix={css({ fontSize: '10.5px', letterSpacing: '0.04em', color: 'var(--ink-3)' })}
                    >
                      {shown}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </Shell>
    )
  }
}
```

- [ ] **Step 4: Delete the scaffold's starter interactivity**

```bash
rm app/actions/public/prompt-button.tsx
```

The scaffold's `home-page.tsx` was the only importer; nothing else references it.

- [ ] **Step 5: Update the root controller**

Replace `app/actions/controller.tsx` entirely:

```tsx
import { createController } from 'remix/router'

import { assetServer } from '../assets.ts'
import { routes } from '../routes.ts'
import { HomePage } from './home-page.tsx'

export default createController(routes, {
  actions: {
    async assets({ request }) {
      return (await assetServer.fetch(request)) ?? new Response('Not Found', { status: 404 })
    },
    home({ render }) {
      return render(<HomePage />)
    },
  },
})
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 5 assertions in `controller.test.tsx`.

- [ ] **Step 7: Commit**

```bash
git add app/actions/home-page.tsx app/actions/controller.tsx app/actions/controller.test.tsx
git rm --cached app/actions/public/prompt-button.tsx 2>/dev/null || true
git add -A app/actions/public
git commit -m "Build the home page"
```

---

## Task 14: Projects section

**Files:**
- Create: `app/actions/projects/controller.tsx`
- Create: `app/actions/projects/projects-page.tsx`
- Modify: `app/router.ts`
- Test: `app/actions/projects/controller.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/actions/projects/controller.test.tsx`:

```tsx
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { router } from '../../router.ts'
import { routes } from '../../routes.ts'

async function fetchPage(href: string) {
  let response = await router.fetch(new Request('http://localhost' + href))
  return { response, html: await response.text() }
}

describe('projects index', () => {
  it('responds 200 and lists every project', async () => {
    let { response, html } = await fetchPage(routes.projects.index.href())
    assert.equal(response.status, 200)
    for (let name of ['La Cancha', 'Queue Scope', 'Trending', 'Movies MX']) {
      assert.match(html, new RegExp(name))
    }
  })

  it('renders the stack chips as links', async () => {
    let { html } = await fetchPage(routes.projects.index.href())
    assert.match(html, /href="\/projects\/stack\/python"/)
  })
})

describe('projects by stack', () => {
  it('filters to the matching projects', async () => {
    let { response, html } = await fetchPage(routes.projects.byStack.href({ tag: 'astro' }))
    assert.equal(response.status, 200)
    assert.match(html, /La Cancha/)
    assert.equal(html.includes('Queue Scope'), false)
  })

  it('shows the empty state for an unknown tag rather than 404ing', async () => {
    let { response, html } = await fetchPage(routes.projects.byStack.href({ tag: 'cobol' }))
    assert.equal(response.status, 200)
    assert.match(html, /no projects match/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — 404, the route is not mapped.

- [ ] **Step 3: Write the page**

Create `app/actions/projects/projects-page.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

import type { Project } from '../../data/projects.ts'
import { slugifyTag, stackTags } from '../../data/projects.ts'
import { routes } from '../../routes.ts'
import { ProjectCard } from '../../ui/project-card.tsx'
import { SectionRule } from '../../ui/section-rule.tsx'
import { Shell } from '../../ui/shell.tsx'

export interface ProjectsPageProps {
  projects: Project[]
  total: number
  /** Slug of the active stack filter, or null on the unfiltered index. */
  activeTag: string | null
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function ProjectsPage(handle: Handle<ProjectsPageProps>) {
  return () => {
    let { projects, total, activeTag } = handle.props
    let tags = stackTags()

    let chip = (label: string, href: string, active: boolean) => (
      <a
        key={href}
        href={href}
        mix={css({
          padding: '6px 11px',
          fontSize: '11px',
          letterSpacing: '0.06em',
          border: '1px solid ' + (active ? 'var(--accent)' : 'var(--rule-2)'),
          background: active ? 'var(--accent)' : 'transparent',
          color: active ? 'var(--on-accent)' : 'var(--ink-2)',
          transition: 'border-color 140ms ease, color 140ms ease, background 140ms ease',
          '&:hover': { borderColor: 'var(--accent)' },
        })}
      >
        {label}
      </a>
    )

    return (
      <Shell
        section="projects"
        title="Projects — Gerardo Martinez"
        description="Things I built to answer a question I actually had."
      >
        <section
          mix={css({
            padding: '72px 48px 40px',
            '@media (max-width: 720px)': { padding: '44px 20px 28px' },
          })}
        >
          <div
            mix={css({
              maxWidth: '1080px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '26px',
            })}
          >
            <span mix={css({ color: 'var(--ink-3)', fontSize: '12px', letterSpacing: '0.16em' })}>
              $ ls projects/
            </span>
            <h1
              mix={css({
                margin: 0,
                fontSize: '54px',
                lineHeight: 1.02,
                letterSpacing: '-0.028em',
                fontWeight: 600,
                color: 'var(--ink)',
                '@media (max-width: 720px)': { fontSize: '38px' },
              })}
            >
              Projects
            </h1>
            <p
              mix={css({
                margin: 0,
                maxWidth: '62ch',
                fontSize: '14.5px',
                lineHeight: 1.75,
                color: 'var(--ink-2)',
                textWrap: 'pretty',
              })}
            >
              Things I built to answer a question I actually had. Most of them collect their own
              data, run on my own infrastructure, and are still running right now.
            </p>
          </div>
        </section>

        <section
          mix={css({
            padding: '0 48px 88px',
            '@media (max-width: 720px)': { padding: '0 20px 44px' },
          })}
        >
          <div
            mix={css({
              maxWidth: '1080px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '26px',
            })}
          >
            <SectionRule label="FILTER BY STACK" trailing={`${pad2(projects.length)} / ${pad2(total)}`} />

            <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '7px' })}>
              {chip('all', routes.projects.index.href(), activeTag === null)}
              {tags.map((tag) =>
                chip(
                  tag,
                  routes.projects.byStack.href({ tag: slugifyTag(tag) }),
                  activeTag === slugifyTag(tag),
                ),
              )}
            </div>

            {projects.length === 0 ? (
              <div
                mix={css({
                  padding: '56px 0',
                  textAlign: 'center',
                  color: 'var(--ink-3)',
                  fontSize: '13px',
                  letterSpacing: '0.06em',
                })}
              >
                no projects match that filter yet
              </div>
            ) : (
              <div
                mix={css({
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '24px',
                  '@media (max-width: 860px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
                })}
              >
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} variant="index" />
                ))}
              </div>
            )}
          </div>
        </section>
      </Shell>
    )
  }
}
```

- [ ] **Step 4: Write the controller**

Create `app/actions/projects/controller.tsx`:

```tsx
import { createController } from 'remix/router'

import { PROJECTS, projectsByStack } from '../../data/projects.ts'
import { routes } from '../../routes.ts'
import { ProjectsPage } from './projects-page.tsx'

export default createController(routes.projects, {
  actions: {
    index({ render }) {
      return render(<ProjectsPage projects={PROJECTS} total={PROJECTS.length} activeTag={null} />)
    },

    byStack({ render, params }) {
      let tag = params.tag
      return render(
        <ProjectsPage projects={projectsByStack(tag)} total={PROJECTS.length} activeTag={tag} />,
      )
    },
  },
})
```

- [ ] **Step 5: Register it**

In `app/router.ts`, add the import and the map call:

```ts
import projectsController from './actions/projects/controller.tsx'
```

and after `router.map(routes, controller)`:

```ts
router.map(routes.projects, projectsController)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 4 assertions in `projects/controller.test.tsx`.

- [ ] **Step 7: Commit**

```bash
git add app/actions/projects app/router.ts
git commit -m "Build the projects section with a path-based stack filter"
```

---

## Task 15: Writing section

**Files:**
- Create: `app/actions/writing/controller.tsx`
- Create: `app/actions/writing/writing-page.tsx`
- Create: `app/actions/writing/article-page.tsx`
- Modify: `app/router.ts`
- Test: `app/actions/writing/controller.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/actions/writing/controller.test.tsx`:

```tsx
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { allPosts } from '../../data/posts.ts'
import { router } from '../../router.ts'
import { routes } from '../../routes.ts'

async function fetchPage(href: string) {
  let response = await router.fetch(new Request('http://localhost' + href))
  return { response, html: await response.text() }
}

describe('writing index', () => {
  it('responds 200 and lists every post', async () => {
    let { response, html } = await fetchPage(routes.writing.index.href())
    assert.equal(response.status, 200)
    for (let post of allPosts()) assert.match(html, new RegExp(post.slug))
  })

  it('links each post to its article', async () => {
    let first = allPosts()[0]!
    let { html } = await fetchPage(routes.writing.index.href())
    assert.match(html, new RegExp(`href="/writing/${first.slug}"`))
  })
})

describe('article', () => {
  it('responds 200 and renders the body', async () => {
    let first = allPosts()[0]!
    let { response, html } = await fetchPage(routes.writing.post.href({ slug: first.slug }))
    assert.equal(response.status, 200)
    assert.match(html, new RegExp(first.minutes + ' MIN'))
  })

  it('renders headings with anchor ids for the contents list', async () => {
    let withHeadings = allPosts().find((post) => post.contents.length > 0)
    assert.notEqual(withHeadings, undefined)
    let { html } = await fetchPage(routes.writing.post.href({ slug: withHeadings!.slug }))
    assert.match(html, new RegExp(`id="${withHeadings!.contents[0]!.id}"`))
  })

  it('404s on an unknown slug', async () => {
    let { response } = await fetchPage(routes.writing.post.href({ slug: 'does-not-exist' }))
    assert.equal(response.status, 404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — 404 on every writing URL.

- [ ] **Step 3: Write the writing index page**

Create `app/actions/writing/writing-page.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

import type { Post } from '../../data/posts.ts'
import { PostCard } from '../../ui/post-card.tsx'
import { SectionRule } from '../../ui/section-rule.tsx'
import { Shell } from '../../ui/shell.tsx'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function WritingPage(handle: Handle<{ posts: Post[] }>) {
  return () => {
    let { posts } = handle.props
    let [featured, ...rest] = posts

    return (
      <Shell
        section="writing"
        title="Writing — Gerardo Martinez"
        description="Notes on modelling messy, real-world data."
      >
        <section
          mix={css({
            padding: '72px 48px 44px',
            '@media (max-width: 720px)': { padding: '44px 20px 28px' },
          })}
        >
          <div
            mix={css({
              maxWidth: '1080px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '26px',
            })}
          >
            <span mix={css({ color: 'var(--ink-3)', fontSize: '12px', letterSpacing: '0.16em' })}>
              $ ls posts/*.md
            </span>
            <h1
              mix={css({
                margin: 0,
                fontSize: '54px',
                lineHeight: 1.02,
                letterSpacing: '-0.028em',
                fontWeight: 600,
                color: 'var(--ink)',
                '@media (max-width: 720px)': { fontSize: '38px' },
              })}
            >
              Writing
            </h1>
            <p
              mix={css({
                margin: 0,
                maxWidth: '62ch',
                fontSize: '14.5px',
                lineHeight: 1.75,
                color: 'var(--ink-2)',
                textWrap: 'pretty',
              })}
            >
              Notes on modelling messy, real-world data — and on the part nobody writes about,
              which is getting a model used by people who did not build it.
            </p>
          </div>
        </section>

        {featured ? (
          <section
            mix={css({
              padding: '0 48px 56px',
              '@media (max-width: 720px)': { padding: '0 20px 32px' },
            })}
          >
            <div mix={css({ maxWidth: '1080px', margin: '0 auto' })}>
              <PostCard post={featured} index={0} variant="featured" />
            </div>
          </section>
        ) : null}

        {rest.length > 0 ? (
          <section
            mix={css({
              padding: '0 48px 88px',
              '@media (max-width: 720px)': { padding: '0 20px 44px' },
            })}
          >
            <div
              mix={css({
                maxWidth: '1080px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '22px',
              })}
            >
              <SectionRule label="EARLIER" trailing={`${pad2(rest.length)} POSTS`} />
              <div mix={css({ display: 'flex', flexDirection: 'column' })}>
                {rest.map((post, i) => (
                  <PostCard key={post.slug} post={post} index={i + 1} variant="row" />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </Shell>
    )
  }
}
```

- [ ] **Step 4: Write the article page**

Create `app/actions/writing/article-page.tsx`:

```tsx
import { css, type Handle } from 'remix/ui'

import type { Post } from '../../data/posts.ts'
import { routes } from '../../routes.ts'
import { ArticleBody } from '../../ui/article-body.tsx'
import { ArrowBack } from '../../ui/icons.tsx'
import { FONT_SANS } from '../../ui/theme.ts'
import { Shell } from '../../ui/shell.tsx'

export function ArticlePage(handle: Handle<{ post: Post }>) {
  return () => {
    let { post } = handle.props

    return (
      <Shell
        section="writing"
        title={`${post.title} — Gerardo Martinez`}
        description={post.hook}
        backTo={{ href: routes.writing.index.href(), label: 'writing' }}
      >
        <section
          mix={css({
            padding: '80px 48px 44px',
            borderBottom: '1px solid var(--rule)',
            '@media (max-width: 720px)': { padding: '44px 20px 28px' },
          })}
        >
          <div
            mix={css({
              maxWidth: '1080px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            })}
          >
            <div
              mix={css({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '10.5px',
                letterSpacing: '0.1em',
                color: 'var(--ink-3)',
              })}
            >
              <span>{post.displayDate}</span>
              <span mix={css({ width: '3px', height: '3px', background: 'var(--rule-2)' })} />
              <span>{post.minutes} MIN READ</span>
              <span mix={css({ width: '3px', height: '3px', background: 'var(--rule-2)' })} />
              <span>{post.sourceFile}</span>
            </div>

            <h1
              mix={css({
                margin: 0,
                maxWidth: '22ch',
                fontSize: '52px',
                lineHeight: 1.08,
                letterSpacing: '-0.028em',
                fontWeight: 600,
                color: 'var(--ink)',
                textWrap: 'balance',
                '@media (max-width: 720px)': { fontSize: '34px' },
              })}
            >
              {post.title}
            </h1>

            <p
              mix={css({
                margin: 0,
                maxWidth: '60ch',
                fontFamily: FONT_SANS,
                fontSize: '19px',
                lineHeight: 1.6,
                color: 'var(--ink-2)',
                textWrap: 'pretty',
              })}
            >
              {post.hook}
            </p>

            {post.tags.length > 0 ? (
              <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' })}>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    mix={css({
                      padding: '4px 8px',
                      border: '1px solid var(--rule-2)',
                      fontSize: '10px',
                      letterSpacing: '0.05em',
                      color: 'var(--ink-2)',
                    })}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section
          mix={css({
            padding: '56px 48px 88px',
            '@media (max-width: 720px)': { padding: '32px 20px 44px' },
          })}
        >
          <div
            mix={css({
              maxWidth: '1080px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 200px',
              gap: '64px',
              alignItems: 'start',
              '@media (max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr)', gap: '32px' },
            })}
          >
            <ArticleBody tokens={post.tokens} />

            {post.contents.length > 0 ? (
              <aside
                mix={css({
                  position: 'sticky',
                  top: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  '@media (max-width: 980px)': { display: 'none' },
                })}
              >
                <span
                  mix={css({
                    fontSize: '10.5px',
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    color: 'var(--ink-3)',
                  })}
                >
                  CONTENTS
                </span>
                <div mix={css({ height: '1px', background: 'var(--rule)' })} />
                <nav mix={css({ display: 'flex', flexDirection: 'column', gap: '2px' })}>
                  {post.contents.map((entry) => (
                    <a
                      key={entry.id}
                      href={`#${entry.id}`}
                      mix={css({
                        display: 'block',
                        padding: entry.depth === 3 ? '7px 0 7px 20px' : '7px 0 7px 10px',
                        fontSize: '11.5px',
                        lineHeight: 1.45,
                        letterSpacing: '0.03em',
                        borderLeft: '2px solid var(--rule)',
                        color: 'var(--ink-3)',
                        transition: 'color 140ms ease, border-color 140ms ease',
                        '&:hover': { color: 'var(--ink)', borderLeftColor: 'var(--accent)' },
                      })}
                    >
                      {entry.label}
                    </a>
                  ))}
                </nav>
              </aside>
            ) : null}
          </div>
        </section>

        <section
          mix={css({
            padding: '0 48px 64px',
            '@media (max-width: 720px)': { padding: '0 20px 40px' },
          })}
        >
          <div mix={css({ maxWidth: '1080px', margin: '0 auto' })}>
            <a
              href={routes.writing.index.href()}
              mix={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--ink)',
                fontSize: '12.5px',
                letterSpacing: '0.07em',
                '&:hover .back-go': { transform: 'translateX(-3px)' },
              })}
            >
              <span
                class="back-go"
                mix={css({
                  display: 'inline-flex',
                  color: 'var(--accent)',
                  transition: 'transform 160ms ease',
                })}
              >
                <ArrowBack />
              </span>
              <span>All writing</span>
            </a>
          </div>
        </section>
      </Shell>
    )
  }
}
```

- [ ] **Step 5: Write the controller**

Create `app/actions/writing/controller.tsx`:

```tsx
import { createController } from 'remix/router'

import { allPosts, findPost } from '../../data/posts.ts'
import { routes } from '../../routes.ts'
import { ArticlePage } from './article-page.tsx'
import { WritingPage } from './writing-page.tsx'

export default createController(routes.writing, {
  actions: {
    index({ render }) {
      return render(<WritingPage posts={allPosts()} />)
    },

    post({ render, params }) {
      let post = findPost(params.slug)
      if (!post) return new Response('Not Found', { status: 404 })
      return render(<ArticlePage post={post} />)
    },
  },
})
```

- [ ] **Step 6: Register it**

In `app/router.ts`, add:

```ts
import writingController from './actions/writing/controller.tsx'
```

and:

```ts
router.map(routes.writing, writingController)
```

- [ ] **Step 6b: Make a malformed post fail at boot, not on a visitor**

`allPosts()` is lazily cached: nothing loads posts until the first request that
needs them. That contradicts the spec's stated intent ("a malformed post fails
at startup, not on a visitor") and is worse than it looks — a throw inside
`cache ??= loadPosts(...)` leaves `cache` null, so *every* subsequent request
re-throws.

Warm it once at startup. In `server.ts`, before `server.listen(...)`:

```ts
import { allPosts } from './app/data/posts.ts'

// Parse every post now so a malformed file fails here, loudly, instead of on
// the first visitor who happens to hit the writing section.
console.log(`Loaded ${allPosts().length} posts`)
```

Verify: temporarily break a post's front matter (delete its `hook:` line), run
`npm run dev`, and confirm the server refuses to start with an error naming that
file. Restore the post afterwards.

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 5 assertions in `writing/controller.test.tsx`.

- [ ] **Step 8: Commit**

```bash
git add app/actions/writing app/router.ts
git commit -m "Build the writing index and article pages"
```

---

## Task 16: Client entries

**Files:**
- Modify: `app/actions/public/theme-toggle.tsx`
- Modify: `app/actions/public/mobile-menu.tsx`
- Test: `app/actions/public/theme-toggle.test.tsx`

Replaces the stubs from Task 8 with real hydrated components. Both take only serializable props.

- [ ] **Step 1: Write the failing test**

Create `app/actions/public/theme-toggle.test.tsx`:

```tsx
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { nextTheme } from './theme-toggle.tsx'

describe('nextTheme', () => {
  it('flips light to dark', () => {
    assert.equal(nextTheme('light'), 'dark')
  })

  it('flips dark to light', () => {
    assert.equal(nextTheme('dark'), 'light')
  })

  it('treats anything unrecognised as light', () => {
    assert.equal(nextTheme(null), 'dark')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `nextTheme` is not exported.

- [ ] **Step 3: Write the theme toggle**

Replace `app/actions/public/theme-toggle.tsx` entirely:

```tsx
import { clientEntry, css, on, type Handle } from 'remix/ui'

import { Moon } from '../../ui/icons.tsx'

export type Theme = 'light' | 'dark'

/** Pure, so it can be tested without a DOM. */
export function nextTheme(current: string | null): Theme {
  return current === 'dark' ? 'light' : 'dark'
}

export const ThemeToggle = clientEntry(
  import.meta.url,
  function ThemeToggle(handle: Handle) {
    // Server render assumes light; hydration corrects it from the DOM, which
    // the no-flash script in <head> has already set.
    let theme: Theme = 'light'

    handle.queueTask(() => {
      let actual = document.documentElement.getAttribute('data-theme')
      if (actual === 'dark' || actual === 'light') {
        if (actual !== theme) {
          theme = actual
          handle.update()
        }
      }
    })

    function toggle() {
      theme = nextTheme(theme)
      document.documentElement.setAttribute('data-theme', theme)
      try {
        localStorage.setItem('theme', theme)
      } catch {
        // Private browsing: the toggle still works for this page view.
      }
      handle.update()
    }

    return () => (
      <button
        type="button"
        aria-label={`Switch to ${nextTheme(theme)} theme`}
        mix={[
          css({
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 11px',
            background: 'transparent',
            border: '1px solid var(--rule-2)',
            color: 'var(--ink-2)',
            fontFamily: 'inherit',
            fontSize: '11px',
            letterSpacing: '0.09em',
            cursor: 'pointer',
            transition: 'border-color 160ms ease, color 160ms ease',
            '&:hover': { borderColor: 'var(--accent)', color: 'var(--accent)' },
          }),
          on('click', toggle),
        ]}
      >
        <Moon />
        <span>{nextTheme(theme)}</span>
      </button>
    )
  },
)
```

- [ ] **Step 4: Write the mobile menu**

Replace `app/actions/public/mobile-menu.tsx` entirely:

```tsx
import { clientEntry, css, on, type Handle } from 'remix/ui'

import { routes } from '../../routes.ts'
import { ThemeToggle } from './theme-toggle.tsx'

type Section = 'index' | 'projects' | 'writing'

const NAV = [
  { key: 'index' as const, label: 'index', href: routes.home.href() },
  { key: 'projects' as const, label: 'projects', href: routes.projects.index.href() },
  { key: 'writing' as const, label: 'writing', href: routes.writing.index.href() },
]

export const MobileMenu = clientEntry(
  import.meta.url,
  function MobileMenu(handle: Handle<{ section: Section }>) {
    let open = false

    return () => (
      <div
        mix={css({
          display: 'none',
          alignItems: 'center',
          gap: '8px',
          '@media (max-width: 720px)': { display: 'flex' },
        })}
      >
        <ThemeToggle />

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open ? 'true' : 'false'}
          mix={[
            css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: '1px solid var(--rule-2)',
              color: 'var(--ink)',
              cursor: 'pointer',
            }),
            on('click', () => {
              open = !open
              handle.update()
            }),
          ]}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d={open ? 'M5 5 L19 19' : 'M4 8h16'} />
            <path d={open ? 'M19 5 L5 19' : 'M4 16h16'} />
          </svg>
        </button>

        {open ? (
          <nav
            mix={css({
              position: 'absolute',
              left: 0,
              right: 0,
              top: '100%',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--paper)',
              borderTop: '1px solid var(--rule)',
              borderBottom: '1px solid var(--rule)',
            })}
          >
            {NAV.map((item) => (
              <a
                key={item.key}
                href={item.href}
                mix={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minHeight: '52px',
                  padding: item.key === handle.props.section ? '0 20px' : '0 36px',
                  color: item.key === handle.props.section ? 'var(--ink)' : 'var(--ink-2)',
                  fontSize: '14px',
                  letterSpacing: '0.08em',
                  borderBottom: '1px solid var(--rule)',
                })}
              >
                {item.key === handle.props.section ? (
                  <span mix={css({ width: '6px', height: '6px', background: 'var(--accent)' })} />
                ) : null}
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    )
  },
)
```

- [ ] **Step 5: Anchor the dropdown**

The menu panel is absolutely positioned against the header. In `app/ui/shell.tsx`, add `position: 'relative'` to the `<header>` style object so `top: 100%` resolves against it.

- [ ] **Step 6: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, no type errors.

- [ ] **Step 7: Verify hydration in a browser**

Run: `npm run dev`
Open `http://localhost:44100`, click the theme button, confirm the palette flips and survives a reload. Narrow the window below 720px and confirm the menu button opens the nav. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add app/actions/public app/ui/shell.tsx
git commit -m "Add theme toggle and mobile menu client entries"
```

---

## Task 17: Prerender

**Files:**
- Create: `prerender.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the script**

Create `prerender.ts` at the repo root:

```ts
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { router } from './app/router.ts'
import { allPosts } from './app/data/posts.ts'
import { slugifyTag, stackTags } from './app/data/projects.ts'
import { routes } from './app/routes.ts'

const OUT_DIR = path.resolve(process.cwd(), 'dist')
const ORIGIN = 'http://localhost'

function urlsToRender(): string[] {
  return [
    routes.home.href(),
    routes.projects.index.href(),
    ...stackTags().map((tag) => routes.projects.byStack.href({ tag: slugifyTag(tag) })),
    routes.writing.index.href(),
    ...allPosts().map((post) => routes.writing.post.href({ slug: post.slug })),
  ]
}

/** `/projects/stack/python` -> `dist/projects/stack/python/index.html` */
function outputPath(href: string): string {
  let relative = href === '/' ? '' : href.replace(/^\//, '')
  return path.join(OUT_DIR, relative, 'index.html')
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true })

  let urls = urlsToRender()
  let failures: string[] = []

  for (let href of urls) {
    let response = await router.fetch(new Request(ORIGIN + href))
    if (response.status !== 200) {
      failures.push(`${href} -> ${response.status}`)
      continue
    }

    let file = outputPath(href)
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, await response.text(), 'utf8')
    console.log(`  ${href}`)
  }

  // Static files served from the app root.
  await fs.cp(path.resolve(process.cwd(), 'public'), OUT_DIR, { recursive: true })

  if (failures.length > 0) {
    console.error(`\nPrerender failed for ${failures.length} URL(s):`)
    for (let failure of failures) console.error(`  ${failure}`)
    process.exit(1)
  }

  console.log(`\nPrerendered ${urls.length} pages to dist/`)
}

await main()
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `scripts`:

```json
"prerender": "NODE_ENV=production node --import remix/node-tsx prerender.ts"
```

- [ ] **Step 3: Run it**

Run: `npm run prerender`
Expected: one line per URL, then `Prerendered N pages to dist/`, exit code 0. With four projects and two sample posts that is 1 home + 1 projects + 11 stack tags + 1 writing + 2 posts.

- [ ] **Step 4: Verify the output is real HTML**

Run: `grep -c "Queue Scope" dist/index.html && ls dist/projects/stack/`
Expected: at least 1, and a directory per stack tag.

**Known limitation to note, not fix:** the prerendered pages reference hashed asset URLs under `/assets/`, which the asset server generates at runtime. Deploying the static output to a host without the Remix server requires copying the built assets alongside it. That is deployment configuration, explicitly out of scope in the spec.

- [ ] **Step 5: Commit**

```bash
git add prerender.ts package.json
git commit -m "Add prerender script"
```

---

## Task 18: Final verification

**Files:** none — this task only runs checks.

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all tests pass, `# fail 0`.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Run the app and walk every route**

Run: `npm run dev`, then in another shell:

```bash
for p in / /projects /projects/stack/python /writing; do
  printf '%s -> %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' localhost:44100$p)"
done
curl -s -o /dev/null -w '/writing/nope -> %{http_code}\n' localhost:44100/writing/nope
```

Expected: `200` for the first four, `404` for the last. Stop the server.

- [ ] **Step 4: Check it at phone width**

With `npm run dev` running, open `http://localhost:44100` at 390px wide. Confirm: no horizontal scroll, the menu button works, project cards stack to one column, and the article page's contents sidebar is hidden.

- [ ] **Step 5: Confirm placeholders are still visible**

Run: `grep -rn "\[YOUR .* URL\]" app/data/about.ts`
Expected: three lines. These are intentional — they are what the site owner fills in. Do not invent values.

- [ ] **Step 6: Commit any stragglers and push the branch**

```bash
git status --short
git push -u origin portfolio-site
```

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task: content layer (5, 6), pure helpers (2, 3, 4), route contract (1), controllers (13, 14, 15), UI (7-12), client entries (16), prerender (17), testing (throughout plus 18), placeholder content (5 for socials, 6 for sample posts). The spec's "Open items" entry — unverified nested-route syntax — is resolved: it was verified empirically and is recorded under "Verified APIs".

**Type consistency.** `Project`, `Post`, `TocEntry`, `About`, `Theme`, `Section`, `ProjectCardVariant`, and `PostCardVariant` are each defined once and imported everywhere else. Function names used across tasks — `featuredProjects`, `stackTags`, `projectsByStack`, `slugifyTag`, `allPosts`, `findPost`, `headingId`, `loadPosts`, `formatPostDate`, `parseFrontMatter`, `linePath`, `areaPath`, `barsPath`, `cellsPath`, `lastPoint`, `inlineTokensOf`, `nextTheme` — match their definitions.

**Ordering dependency.** `Shell` (Task 8) imports the two client entries, so Task 8 creates them as stubs and Task 16 replaces them. Every task in between typechecks.

**Deliberately deferred.** Deployment config, CI, RSS, search, pagination, and image optimisation are out of scope per the spec.
