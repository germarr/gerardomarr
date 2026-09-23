import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { ABOUT } from '../data/about.ts'
import { allPosts } from '../data/posts.ts'
import { featuredProjects, PROJECTS } from '../data/projects.ts'
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

  it('shows every featured project and no unfeatured one', async () => {
    let { html } = await fetchPage(routes.home.href())
    for (let project of PROJECTS) {
      assert.equal(html.includes(project.name), project.featured)
    }
  })

  it('renders exactly one card per featured project', async () => {
    let { html } = await fetchPage(routes.home.href())
    // Every ProjectCard link opens in a new tab (target="_blank") and
    // nothing else on the home page does -- distinguishes "the right
    // projects appear" (checked above by name) from "and each appears
    // exactly once, with none duplicated".
    let cardCount = (html.match(/target="_blank"/g) ?? []).length
    assert.equal(cardCount, featuredProjects().length)
  })

  it('links to each social profile, with the label matching the url', async () => {
    // SOCIALS in home-page.tsx carries the display text while ABOUT carries
    // the href, so the two can drift apart. Checking both against the same
    // page catches a handle that was updated in only one of the files.
    let { html } = await fetchPage(routes.home.href())
    for (let [url, label] of [
      [ABOUT.social.github, 'github.com/germarr'],
      [ABOUT.social.linkedin, 'linkedin.com/in/martinezarroyogerardo'],
      [ABOUT.social.instagram, 'instagram.com/gmarr.ai'],
    ]) {
      let escaped = (value: string) => value.replace(/[.]/g, '\\.')
      assert.match(html, new RegExp(`href="${escaped(url!)}"`))
      assert.match(html, new RegExp(escaped(label!)))
      // The label is the url minus scheme and any `www.` -- if one is edited
      // without the other, this is what fails.
      assert.equal(url!.includes(label!), true)
    }
  })

  it('links to the projects and writing sections', async () => {
    let { html } = await fetchPage(routes.home.href())
    assert.match(html, /href="\/projects"/)
    assert.match(html, /href="\/writing"/)
  })

  it('links to the two most recent posts', async () => {
    // WritingSection renders `allPosts().slice(0, 2)`; deriving the expected
    // slugs the same way keeps this test tied to the selection rule rather
    // than to whichever posts happen to be on disk.
    let recent = allPosts().slice(0, 2)
    let { html } = await fetchPage(routes.home.href())
    assert.equal(recent.length, 2)
    for (let post of recent) assert.match(html, new RegExp(`href="/writing/${post.slug}"`))
  })
})
