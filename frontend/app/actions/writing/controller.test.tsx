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

  // Route-level check that every entry in a post's contents is rendered as a
  // matching anchor id. Quiet while no post has headings; the contract itself
  // is locked against a fixture in `app/ui/article-body.test.ts`, so this does
  // not depend on any particular post being written a particular way.
  it('renders an anchor id for every contents entry', async () => {
    for (let post of allPosts()) {
      if (post.contents.length === 0) continue
      let { html } = await fetchPage(routes.writing.post.href({ slug: post.slug }))
      for (let entry of post.contents) assert.match(html, new RegExp(`id="${entry.id}"`))
    }
  })

  it('404s on an unknown slug', async () => {
    let { response } = await fetchPage(routes.writing.post.href({ slug: 'does-not-exist' }))
    assert.equal(response.status, 404)
  })
})
