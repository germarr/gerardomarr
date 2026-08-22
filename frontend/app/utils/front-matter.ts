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
 * `title`, `hook`, `date`, and `minutes` are required; `tags` and `image`
 * are optional and default to `[]` and `''` respectively (`image` falls
 * back to a plate in the UI). A value containing `#` must be quoted, since
 * an unquoted `#` starts a comment and truncates the rest of the value.
 * `filename` is only used to make failures identifiable.
 *
 * This runs at boot over author-written files. Anything malformed —
 * a missing field, an unterminated quote, a duplicate key, a tags list
 * missing its brackets, a non-numeric `minutes` — must throw, naming the
 * file and field, rather than silently degrade into wrong content.
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
  let bodyStart = text.indexOf('\n', end + 1)
  let body = bodyStart === -1 ? '' : text.slice(bodyStart + 1).trim()

  let fields = new Map<string, string>()
  for (let line of block.split('\n')) {
    let trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue

    let colon = trimmed.indexOf(':')
    if (colon === -1) throw new Error(`${filename}: cannot parse front-matter line "${trimmed}"`)

    let key = trimmed.slice(0, colon).trim()
    if (fields.has(key)) throw new Error(`${filename}: front matter has a duplicate "${key}"`)

    let value = stripComment(trimmed.slice(colon + 1).trim())
    fields.set(key, value)
  }

  let tagsRaw = fields.get('tags')

  return {
    frontMatter: {
      title: requireString(fields, 'title', filename),
      hook: requireString(fields, 'hook', filename),
      date: requireDate(fields, 'date', filename),
      minutes: requireNumber(fields, 'minutes', filename),
      tags: tagsRaw === undefined ? [] : parseList(tagsRaw, filename),
      image: unquote(fields.get('image') ?? '', filename, 'image'),
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

/** Unquote a scalar value. Throws if it opens a quote it never closes. */
function unquote(value: string, filename: string, key: string): string {
  let first = value[0]
  if (first === '"' || first === "'") {
    if (value.length < 2 || value[value.length - 1] !== first) {
      throw new Error(`${filename}: front matter "${key}" has an unterminated quote`)
    }
    return value.slice(1, -1)
  }
  return value
}

/** Split on top-level commas, leaving commas inside quotes intact. */
function splitQuoteAware(value: string): string[] {
  let parts: string[] = []
  let current = ''
  let quote: string | null = null

  for (let ch of value) {
    if (quote) {
      current += ch
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
      current += ch
    } else if (ch === ',') {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

function parseList(value: string, filename: string): string[] {
  let inner = value.trim()
  if (!inner.startsWith('[') || !inner.endsWith(']')) {
    throw new Error(`${filename}: front matter "tags" must be an inline list like [a, b]`)
  }
  inner = inner.slice(1, -1).trim()
  if (inner === '') return []
  return splitQuoteAware(inner)
    .map((entry) => unquote(entry.trim(), filename, 'tags'))
    .filter(Boolean)
}

function requireString(fields: Map<string, string>, key: string, filename: string): string {
  let raw = fields.get(key)
  if (raw === undefined) throw new Error(`${filename}: front matter is missing "${key}"`)
  let value = unquote(raw, filename, key)
  if (value === '') throw new Error(`${filename}: front matter "${key}" is empty`)
  return value
}

function requireDate(fields: Map<string, string>, key: string, filename: string): string {
  let value = unquote(fields.get(key) ?? '', filename, key)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${filename}: front matter "${key}" must be YYYY-MM-DD, got "${value}"`)
  }
  return value
}

function requireNumber(fields: Map<string, string>, key: string, filename: string): number {
  let raw = fields.get(key)
  if (raw === undefined) throw new Error(`${filename}: front matter is missing "${key}"`)
  let value = unquote(raw, filename, key)
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`${filename}: front matter "${key}" must be a number, got "${raw}"`)
  }
  return Number.parseInt(value, 10)
}
