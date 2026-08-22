import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { renderToString } from 'remix/ui/server'

import type { Post } from '../data/posts.ts'
import { routes } from '../routes.ts'
import { PostCard, type PostCardVariant } from './post-card.tsx'

const VARIANTS: PostCardVariant[] = ['featured', 'row', 'compact']

function stub(overrides: Partial<Post> = {}): Post {
  return {
    slug: 'sample-post',
    title: 'A sample post title',
    hook: 'A one-sentence hook describing the post.',
    date: '2026-08-14',
    displayDate: 'AUG 14 2026',
    minutes: 7,
    tags: ['sample', 'writing'],
    image: '',
    sourceFile: 'posts/sample-post.md',
    tokens: [],
    contents: [],
    ...overrides,
  }
}

function allStyles(html: string): string {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
}

describe('PostCard', () => {
  it('renders exactly one anchor per card, wrapping the whole thing, with the real post url as href', async () => {
    for (let variant of VARIANTS) {
      let post = stub()
      let html = await renderToString(<PostCard post={post} index={0} variant={variant} />)
      let anchorOpenTags = html.match(/<a /g) ?? []
      assert.equal(anchorOpenTags.length, 1)
      let href = routes.writing.post.href({ slug: post.slug })
      assert.match(html, new RegExp(`<a href="${href.replace(/[.]/g, '\\.')}"`))
    }
  })

  it('cycles the hatch angle through 4 steps by index, repeating at index 4', async () => {
    let post = stub()
    let angles: string[] = []
    for (let index = 0; index < 5; index++) {
      let html = await renderToString(<PostCard post={post} index={index} variant="row" />)
      let match = /repeating-linear-gradient\((-?\d+)deg/.exec(html)
      assert.ok(match)
      angles.push(match![1]!)
    }
    assert.equal(angles[0], angles[4])
    assert.equal(new Set(angles.slice(0, 4)).size, 4)
  })

  it('renders the cover image and skips the ordinal plate when post.image is set', async () => {
    for (let variant of VARIANTS) {
      let withImage = stub({ image: '/images/cover.jpg' })
      let html = await renderToString(<PostCard post={withImage} index={0} variant={variant} />)
      assert.match(html, /background-image:\s*url\(/)
      assert.equal(/repeating-linear-gradient/.test(html), false)
      assert.equal(/>01</.test(html), false)

      let withoutImage = stub({ image: '' })
      let plateHtml = await renderToString(<PostCard post={withoutImage} index={0} variant={variant} />)
      assert.match(plateHtml, /repeating-linear-gradient/)
      assert.match(plateHtml, />01</)
    }
  })

  it('compiles the nested &:hover selectors into real CSS rules for title colour, arrow shift, and (row) plate border', async () => {
    let post = stub()

    let featuredHtml = await renderToString(<PostCard post={post} index={0} variant="featured" />)
    let featuredSheet = allStyles(featuredHtml)
    assert.match(featuredSheet, /&:hover \{[\s\S]*?border-color:\s*var\(--accent\)/)
    assert.match(featuredSheet, /&:hover \.card-title \{[\s\S]*?color:\s*var\(--accent\)/)
    assert.match(featuredSheet, /&:hover \.card-go \{[\s\S]*?transform:\s*translate\(2px, -2px\)/)

    let rowHtml = await renderToString(<PostCard post={post} index={0} variant="row" />)
    let rowSheet = allStyles(rowHtml)
    assert.match(rowSheet, /&:hover \.card-plate \{[\s\S]*?border-color:\s*var\(--accent\)/)
    assert.match(rowSheet, /&:hover \.card-title \{[\s\S]*?color:\s*var\(--accent\)/)
    assert.match(rowSheet, /&:hover \.card-go \{[\s\S]*?transform:\s*translate\(2px, -2px\)/)

    let compactHtml = await renderToString(<PostCard post={post} index={0} variant="compact" />)
    let compactSheet = allStyles(compactHtml)
    assert.match(compactSheet, /&:hover \.card-title \{[\s\S]*?color:\s*var\(--accent\)/)
  })

  it('pushes the featured "read the piece" row to the bottom with margin-top: auto', async () => {
    let post = stub()
    let html = await renderToString(<PostCard post={post} index={0} variant="featured" />)
    assert.match(html, /read the piece/)
    assert.match(allStyles(html), /margin-top:\s*auto/)
  })

  it('omits sourceFile from the meta row and the read link in the compact variant', async () => {
    let post = stub()
    let html = await renderToString(<PostCard post={post} index={0} variant="compact" />)
    assert.equal(html.includes(post.sourceFile), false)
    assert.equal(html.includes('read the piece'), false)
    assert.equal(/>read</.test(html), false)
  })

  it('renders bracketed placeholder titles and hooks without breaking the markup', async () => {
    let post = stub({
      title: '[Title — up to about 60 characters]',
      hook: '[Hook — one sentence, about 140 characters, on what the reader walks away with.]',
    })
    for (let variant of VARIANTS) {
      let html = await renderToString(<PostCard post={post} index={0} variant={variant} />)
      let anchorOpenTags = html.match(/<a /g) ?? []
      assert.equal(anchorOpenTags.length, 1)
      assert.match(html, /\[Title — up to about 60 characters\]/)
    }
  })
})
