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
