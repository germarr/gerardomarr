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
