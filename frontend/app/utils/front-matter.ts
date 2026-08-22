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
  let body = text.slice(text.indexOf('\n', end + 1) + 1).trim()

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
