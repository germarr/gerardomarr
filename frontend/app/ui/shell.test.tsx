import * as fs from 'node:fs'
import * as url from 'node:url'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { renderToString } from 'remix/ui/server'

import { Shell } from './shell.tsx'

const SOURCE_PATH = url.fileURLToPath(new URL('./shell.tsx', import.meta.url))

/**
 * Detects a parent->descendant selector like `'&:hover .nav-underline'` or
 * `'& .nav-underline'` among the quoted `&`-prefixed keys in a component's
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

function allStyles(html: string): string {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
}

describe('Shell', () => {
  it(
    'drives the inactive nav link\'s underline reveal on hover through an inherited custom ' +
      'property set on the link\'s own &:hover, not a descendant selector',
    async () => {
      // Parent components render inside their own `@layer`, declared
      // *after* every child's, so a parent rule that names a descendant
      // class (e.g. '&:hover .nav-underline { transform: ... }') always
      // loses the cascade to that child's own layer -- it still compiles
      // and appears in the emitted CSS, it just never applies. The fix:
      // the link sets a custom property on itself (self-targeting, so no
      // cross-layer conflict), and the underline span consumes it with a
      // fallback. Custom properties inherit, sidestepping layers entirely.
      let html = await renderToString(<Shell section="index" />)
      let sheet = allStyles(html)
      assert.match(sheet, /&:hover \{[\s\S]*?--nav-underline-transform:\s*scaleX\(1\)/)
      assert.match(sheet, /transform:\s*var\(--nav-underline-transform, scaleX\(0\)\)/)
    },
  )

  it('regression guard: no css() in shell.tsx reaches into a descendant with a parent-owned selector', () => {
    // See hasCrossLayerDescendantSelector's doc comment for why this is the
    // check and not a rendered-CSS-text assertion: the old, broken
    // '&:hover .nav-underline' rule also compiled and rendered just fine,
    // it simply never applied. A source-level structural check fails on
    // the *pattern* itself, independent of whether the rule happens to
    // still parse -- a rendered-output assertion cannot tell "present but
    // inert" from "present and applied" without a real browser.
    let source = fs.readFileSync(SOURCE_PATH, 'utf8')
    assert.equal(hasCrossLayerDescendantSelector(source), false)
  })

  it('renders exactly one underline element per inactive nav item, and none for the active one', async () => {
    let html = await renderToString(<Shell section="projects" />)
    // section="projects" -> "index" and "writing" are inactive (2
    // underlines), "projects" itself is active (no underline element at
    // all -- it renders a dot instead).
    let underlineCount = (html.match(/class="nav-underline/g) ?? []).length
    assert.equal(underlineCount, 2)
  })
})
