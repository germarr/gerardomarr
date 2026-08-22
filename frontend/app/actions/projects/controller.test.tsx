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

  it('marks the "all" chip aria-current, and no other chip, when no tag is selected', async () => {
    let { html } = await fetchPage(routes.projects.index.href())
    // Colour alone used to be the only signal for the active chip. Scope to
    // the filter nav landmark so the primary header nav's own
    // aria-current="page" (on "projects") doesn't get counted here too.
    let nav = /<nav aria-label="Filter by stack"[\s\S]*?<\/nav>/.exec(html)
    assert.ok(nav)
    let currentCount = (nav![0].match(/aria-current="page"/g) ?? []).length
    assert.equal(currentCount, 1)
    assert.match(nav![0], /href="\/projects" aria-current="page"/)
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

  it('marks the matching stack chip aria-current, and no other chip -- not "all"', async () => {
    let { html } = await fetchPage(routes.projects.byStack.href({ tag: 'astro' }))
    let nav = /<nav aria-label="Filter by stack"[\s\S]*?<\/nav>/.exec(html)
    assert.ok(nav)
    let currentCount = (nav![0].match(/aria-current="page"/g) ?? []).length
    assert.equal(currentCount, 1)
    assert.match(nav![0], /href="\/projects\/stack\/astro" aria-current="page"/)
    assert.equal(/href="\/projects" aria-current="page"/.test(nav![0]), false)
  })
})
