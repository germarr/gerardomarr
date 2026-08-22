import * as path from 'node:path'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { type HeadingToken, loadPosts } from './posts.ts'

const FIXTURES = path.resolve(import.meta.dirname, '../../test/fixtures/posts')
const COLLISION_FIXTURES = path.resolve(
  import.meta.dirname,
  '../../test/fixtures/posts-heading-collisions',
)

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

describe('heading id de-duplication', () => {
  it('gives distinct ids to headings that collapse to the same base slug', () => {
    let post = loadPosts(COLLISION_FIXTURES)[0]!
    let ids = post.contents.map((entry) => entry.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('de-duplicates a three-way collision as x, x-2, x-3', () => {
    let post = loadPosts(COLLISION_FIXTURES)[0]!
    assert.deepEqual(post.contents.slice(0, 3).map((entry) => entry.id), [
      'section-overview',
      'section-overview-2',
      'section-overview-3',
    ])
  })

  it('falls back to a stable id when a heading reduces to an empty base slug', () => {
    let post = loadPosts(COLLISION_FIXTURES)[0]!
    let last = post.contents[post.contents.length - 1]!
    assert.notEqual(last.id, '')
    assert.equal(last.id, 'section-4')
  })

  it('gives each heading token the same id as its contents entry', () => {
    let post = loadPosts(COLLISION_FIXTURES)[0]!
    let headingTokens = post.tokens.filter(
      (token): token is HeadingToken => token.type === 'heading',
    )
    assert.deepEqual(
      headingTokens.map((token) => token.id),
      post.contents.map((entry) => entry.id),
    )
  })
})
