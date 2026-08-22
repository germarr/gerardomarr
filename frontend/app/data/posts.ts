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

/**
 * A `marked` heading token with its final, de-duplicated `id` attached by
 * `readPost`. Task 12's renderer reads `id` straight off the token instead
 * of recomputing it, so the anchor it renders always matches the id used
 * in `contents`.
 */
export type HeadingToken = Token & { depth: number; text: string; id: string }

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
  assignHeadingIds(tokens)

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

/**
 * Assign every heading token a final, unique `id`, mutating `tokens` in
 * place. This is the single source of truth for heading ids: `contents`
 * below reads the ids straight off the tokens it just annotated, and
 * Task 12's renderer does the same, so the table of contents can never
 * link to an anchor the renderer didn't also produce.
 *
 * Ids are de-duplicated per post by appending `-2`, `-3`, ... to repeats
 * of the same base slug. A heading whose text reduces to an empty base
 * (e.g. "¿?") falls back to `section-<n>`, keyed by that heading's
 * 1-based position among all headings in the post, so it is still stable
 * and unique rather than the empty string.
 */
function assignHeadingIds(tokens: Token[]): void {
  let used = new Set<string>()
  let headingIndex = 0

  for (let token of tokens) {
    if (token.type !== 'heading') continue
    headingIndex++
    let heading = token as HeadingToken
    let base = headingId(heading.text) || `section-${headingIndex}`

    let id = base
    let suffix = 2
    while (used.has(id)) {
      id = `${base}-${suffix}`
      suffix++
    }
    used.add(id)
    heading.id = id
  }
}

function buildContents(tokens: Token[]): TocEntry[] {
  let entries: TocEntry[] = []
  for (let token of tokens) {
    if (token.type !== 'heading') continue
    let heading = token as HeadingToken
    if (heading.depth !== 2 && heading.depth !== 3) continue
    entries.push({ id: heading.id, label: heading.text, depth: heading.depth })
  }
  return entries
}

/**
 * Base slug for a heading's text: lowercase, alphanumerics only, hyphen
 * separated. Not unique on its own — two different headings can reduce to
 * the same base (e.g. "Section: Overview" and "Section — Overview" both
 * collapse to "section-overview"). `readPost`'s `assignHeadingIds` is the
 * source of truth for the final, de-duplicated id attached to each heading
 * token; call this directly only when you need the raw slug itself.
 */
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
