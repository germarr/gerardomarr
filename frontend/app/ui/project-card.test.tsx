import * as fs from 'node:fs'
import * as url from 'node:url'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { renderToString } from 'remix/ui/server'

import { PROJECTS } from '../data/projects.ts'
import { ProjectCard } from './project-card.tsx'

const SOURCE_PATH = url.fileURLToPath(new URL('./project-card.tsx', import.meta.url))

/**
 * Detects a parent->descendant selector like `'&:hover .card-name'` or
 * `'& .card-name'` among the quoted `&`-prefixed keys in a component's
 * source. Cascade layers (one per component, ordered by render order) give
 * the later layer's declarations priority regardless of selector
 * specificity, so a rule that reaches into a descendant from a parent's
 * `mix={css({...})}` silently loses to that descendant's own layer. Such a
 * rule always parses fine and always renders in the emitted CSS text, so
 * only a source-level structural check (or a real browser) can catch it.
 */
function hasCrossLayerDescendantSelector(source: string): boolean {
  let keyPattern = /['"](&[^'"]*)['"]\s*:/g
  let match: RegExpExecArray | null
  while ((match = keyPattern.exec(source))) {
    // Comma-separated compound selectors (e.g. '&[aria-selected], &[rmx-focus]')
    // are one rule targeting the element itself repeatedly, not a descendant
    // combinator -- collapse ", " before checking for a bare space.
    let key = match[1]!.replace(/,\s*/g, ',')
    if (/\s/.test(key)) return true
  }
  return false
}

// Each mix={css(...)} call gets its own <style>, one per generated class
// (its own @layer), so a check spanning multiple elements needs every
// <style> tag's contents, not just the first one.
function allStyles(html: string): string {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
}

describe('ProjectCard', () => {
  it('renders exactly one anchor per card, wrapping the whole thing, with the real project url as href', async () => {
    for (let project of PROJECTS) {
      let html = await renderToString(<ProjectCard project={project} />)
      let anchorOpenTags = html.match(/<a /g) ?? []
      assert.equal(anchorOpenTags.length, 1)
      assert.match(html, new RegExp(`<a href="${project.url.replace(/[.]/g, '\\.')}"`))
    }
  })

  it('renders every project.tech entry as a chip', async () => {
    let project = PROJECTS.find((p) => p.tech.length > 3)!
    let html = await renderToString(<ProjectCard project={project} />)
    for (let tag of project.tech) {
      assert.match(html, new RegExp(`>${tag.replace(/[.]/g, '\\.')}<`))
    }
  })

  it('emits distinct sizes for the index and home variants', async () => {
    let project = PROJECTS[0]!
    let indexHtml = await renderToString(<ProjectCard project={project} variant="index" />)
    let homeHtml = await renderToString(<ProjectCard project={project} variant="home" />)
    assert.match(indexHtml, /font-size:\s*18px/)
    assert.match(homeHtml, /font-size:\s*15px/)
    assert.equal(indexHtml.includes('font-size:15px') || indexHtml.includes('font-size: 15px'), false)
  })

  it('drives the name colour and arrow shift on hover through inherited custom properties set on the card\'s own &:hover, not a descendant selector', async () => {
    // Parent components render inside their own `@layer`, declared *after*
    // every child's, so a parent rule that names a descendant class (e.g.
    // '&:hover .card-name { color: ... }') always loses the cascade to
    // that child's own layer -- it still compiles and appears in the
    // emitted CSS, it just never applies. The fix: the parent sets a custom
    // property on itself (self-targeting, so no cross-layer conflict), and
    // the descendant consumes it with a fallback. Custom properties
    // inherit, sidestepping layers entirely.
    let project = PROJECTS[0]!
    let html = await renderToString(<ProjectCard project={project} />)
    // Find the generated class name applied to the card anchor and its emitted rule block.
    let anchorTag = /<a\s[^>]*>/.exec(html)
    assert.ok(anchorTag)
    let anchorClass = /class="([^"]+)"/.exec(anchorTag![0]!)
    assert.ok(anchorClass)
    let cls = anchorClass![1]!.split(' ')[0]!
    let sheet = allStyles(html)
    assert.match(
      sheet,
      new RegExp(
        `\\.${cls}\\s*\\{[\\s\\S]*&:hover \\{[\\s\\S]*?--card-name-color:\\s*var\\(--accent\\)`,
      ),
    )
    assert.match(
      sheet,
      new RegExp(
        `\\.${cls}\\s*\\{[\\s\\S]*&:hover \\{[\\s\\S]*?--card-go-transform:\\s*translate\\(2px, -2px\\)`,
      ),
    )
    assert.match(sheet, /color:\s*var\(--card-name-color, var\(--ink\)\)/)
    assert.match(sheet, /transform:\s*var\(--card-go-transform, translate\(0, 0\)\)/)
  })

  it('regression guard: css() never reaches into a descendant with a parent-owned selector', () => {
    // See hasCrossLayerDescendantSelector's doc comment above for why this
    // is the check and not a rendered-CSS-text assertion: the old, broken
    // '&:hover .card-name' rule also compiled and rendered just fine, it
    // simply never applied. A source-level structural check fails on the
    // *pattern* itself, independent of whether the rule happens to still
    // parse -- a rendered-output assertion cannot tell "present but inert"
    // from "present and applied" without a real browser.
    let source = fs.readFileSync(SOURCE_PATH, 'utf8')
    assert.equal(hasCrossLayerDescendantSelector(source), false)
  })

  it('opens external project links in a new tab with a safe rel and a concise accessible name', async () => {
    let project = PROJECTS[0]!
    let html = await renderToString(<ProjectCard project={project} />)
    let anchorTag = /<a\s[^>]*>/.exec(html)
    assert.ok(anchorTag)
    assert.match(anchorTag![0]!, /target="_blank"/)
    assert.match(anchorTag![0]!, /rel="noopener noreferrer"/)
    assert.match(
      anchorTag![0]!,
      new RegExp(`aria-label="${project.name}, ${project.host} \\(opens in a new tab\\)"`),
    )
  })

  it('stretches the info column and pins the tag row to the card\'s bottom edge, so a taller neighbour in a grid row does not leave a gap under a shorter card\'s tags', async () => {
    let project = PROJECTS[0]!
    let html = await renderToString(<ProjectCard project={project} variant="home" />)
    assert.match(html, /flex:\s*1 1 auto/)
    assert.match(html, /margin-top:\s*auto/)
  })
})
