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
