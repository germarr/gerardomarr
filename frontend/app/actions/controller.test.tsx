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

  it('renders exactly three project cards', async () => {
    let { html } = await fetchPage(routes.home.href())
    // Every ProjectCard link opens in a new tab (target="_blank") and
    // nothing else on the home page does -- distinguishes "the right three
    // projects appear" (checked above by name) from "and there are exactly
    // three cards, not four with one duplicated".
    let cardCount = (html.match(/target="_blank"/g) ?? []).length
    assert.equal(cardCount, 3)
  })

  it('links to the projects and writing sections', async () => {
    let { html } = await fetchPage(routes.home.href())
    assert.match(html, /href="\/projects"/)
    assert.match(html, /href="\/writing"/)
  })

  it('links to both recent posts', async () => {
    let { html } = await fetchPage(routes.home.href())
    assert.match(html, /href="\/writing\/2026-08-14-sample-post"/)
    assert.match(html, /href="\/writing\/2026-06-02-second-sample"/)
  })
})
