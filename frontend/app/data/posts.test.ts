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
