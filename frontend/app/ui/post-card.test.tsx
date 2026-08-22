import * as fs from 'node:fs'
import * as url from 'node:url'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { renderToString } from 'remix/ui/server'

import type { Post } from '../data/posts.ts'
import { routes } from '../routes.ts'
import { cssUrl, PostCard, type PostCardVariant } from './post-card.tsx'

const SOURCE_PATH = url.fileURLToPath(new URL('./post-card.tsx', import.meta.url))

/**
 * Detects a parent->descendant selector like `'&:hover .card-title'` or
 * `'& .card-title'` among the quoted `&`-prefixed keys in a component's
 * source. Cascade layers (one per component, ordered by render order) give
 * the later layer's declarations priority regardless of selector
 * specificity, so a rule that reaches into a descendant from a parent's
 * `mix={css({...})}` silently loses to that descendant's own layer. Such a
 * rule always parses fine and always renders in the emitted CSS text, so
 * only a source-level structural check (or a real browser) can catch it --
 * see the class comment on the guard test below for why this form was
 * chosen over a Playwright test.
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

  it('drives descendant hover styling through inherited custom properties set on the card\'s own &:hover, not a descendant selector', async () => {
    // Parent components render inside their own `@layer`, declared *after*
    // every child's, so a parent rule that names a descendant class (e.g.
    // '&:hover .card-title { color: ... }') always loses the cascade to
    // that child's own layer -- it still compiles and appears in the
    // emitted CSS, it just never applies. The fix: the parent sets a custom
    // property on itself (self-targeting, so no cross-layer conflict), and
    // the descendant consumes it with a fallback. Custom properties
    // inherit, sidestepping layers entirely.
    let post = stub()

    let featuredHtml = await renderToString(<PostCard post={post} index={0} variant="featured" />)
    let featuredSheet = allStyles(featuredHtml)
    assert.match(featuredSheet, /&:hover \{[\s\S]*?border-color:\s*var\(--accent\)/)
    assert.match(
      featuredSheet,
      /&:hover \{[\s\S]*?--card-title-color:\s*var\(--accent\)[\s\S]*?\}/,
    )
    assert.match(
      featuredSheet,
      /&:hover \{[\s\S]*?--card-go-transform:\s*translate\(2px, -2px\)[\s\S]*?\}/,
    )
    assert.match(featuredSheet, /color:\s*var\(--card-title-color, var\(--ink\)\)/)
    assert.match(featuredSheet, /transform:\s*var\(--card-go-transform, translate\(0, 0\)\)/)

    let rowHtml = await renderToString(<PostCard post={post} index={0} variant="row" />)
    let rowSheet = allStyles(rowHtml)
    assert.match(
      rowSheet,
      /&:hover \{[\s\S]*?--card-plate-border-color:\s*var\(--accent\)[\s\S]*?\}/,
    )
    assert.match(rowSheet, /&:hover \{[\s\S]*?--card-title-color:\s*var\(--accent\)[\s\S]*?\}/)
    assert.match(rowSheet, /&:hover \{[\s\S]*?--card-go-transform:\s*translate\(2px, -2px\)[\s\S]*?\}/)
    assert.match(rowSheet, /border-color:\s*var\(--card-plate-border-color, var\(--rule\)\)/)
    assert.match(rowSheet, /color:\s*var\(--card-title-color, var\(--ink\)\)/)

    let compactHtml = await renderToString(<PostCard post={post} index={0} variant="compact" />)
    let compactSheet = allStyles(compactHtml)
    assert.match(compactSheet, /&:hover \{[\s\S]*?--card-title-color:\s*var\(--accent\)[\s\S]*?\}/)
    assert.match(compactSheet, /color:\s*var\(--card-title-color, var\(--ink\)\)/)
  })

  it('regression guard: no variant\'s css() reaches into a descendant with a parent-owned selector', () => {
    // See hasCrossLayerDescendantSelector's doc comment for why this is the
    // check and not a rendered-CSS-text assertion: the old, broken
    // '&:hover .card-title' rule also compiled and rendered just fine, it
    // simply never applied. A source-level structural check is the only
    // form that fails on the *pattern*, independent of whether the rule
    // happens to still parse. A Playwright test would also catch a
    // regression, but only for the exact interactions it happens to probe,
    // and needs a running dev server; this check is instant, has no such
    // gaps, and runs as a normal part of `npm test`.
    let source = fs.readFileSync(SOURCE_PATH, 'utf8')
    assert.equal(hasCrossLayerDescendantSelector(source), false)
  })

  it('hides the row variant\'s "read" element under 720px via its own media query, not the parent\'s', async () => {
    let post = stub()
    let html = await renderToString(<PostCard post={post} index={0} variant="row" />)
    let sheet = allStyles(html)

    // The parent used to reach into '& .card-read' from inside its own
    // media query -- same cross-layer problem as the hover rules, since
    // the parent's layer always loses to card-read's own. Confirm that's
    // gone, and that the rule instead lives on card-read's own generated
    // class, inside a media query it owns.
    assert.equal(/&\s*\.card-read/.test(sheet), false)

    let readTag = /<div class="card-read[^"]*"[^>]*>/.exec(html)
    assert.ok(readTag)
    let readClass = /class="([^"]+)"/.exec(readTag![0]!)![1]!.split(' ')[1]!
    let classEsc = readClass.replace(/[.]/g, '\\.')
    assert.match(
      sheet,
      new RegExp(
        `@media \\(max-width: 720px\\) \\{[\\s\\S]*?\\.${classEsc}\\s*\\{[\\s\\S]*?display:\\s*none`,
      ),
    )
  })

  it('gives the compact variant its own padding and top rule, matching the spacing every other compact entry needs to stack without collapsing', async () => {
    let post = stub()
    let html = await renderToString(<PostCard post={post} index={0} variant="compact" />)
    let sheet = allStyles(html)
    assert.match(sheet, /padding:\s*18px 0/)
    assert.match(sheet, /border-top:\s*1px solid var\(--rule\)/)
  })

  it('gives each variant\'s whole-card link a concise accessible name, and marks the decorative ordinal aria-hidden', async () => {
    let post = stub()
    for (let variant of VARIANTS) {
      let html = await renderToString(<PostCard post={post} index={0} variant={variant} />)
      let anchorTag = /<a\s[^>]*>/.exec(html)
      assert.ok(anchorTag)
      let expectedLabel = `${post.title} (${post.displayDate}, ${post.minutes} min read)`
      assert.match(anchorTag![0]!, new RegExp(`aria-label="${expectedLabel.replace(/[().]/g, '\\$&')}"`))

      // The ordinal ("01") is decorative -- it's not shown at all once an
      // image is set -- so it must not be announced.
      let ordinalTag = /<span[^>]*>0[12]<\/span>/.exec(html)
      assert.ok(ordinalTag)
      assert.match(ordinalTag![0]!, /aria-hidden="true"/)
    }
  })

  it('cssUrl escapes backslashes and quotes, and strips raw newlines, so a stray character in post.image cannot break out of the CSS string', () => {
    assert.equal(cssUrl('/img/plain.jpg'), 'url("/img/plain.jpg")')
    assert.equal(cssUrl('/img/quo"te.jpg'), 'url("/img/quo\\"te.jpg")')
    assert.equal(cssUrl('C:\\images\\x.jpg'), 'url("C:\\\\images\\\\x.jpg")')

    // The exact injection payload: an unescaped newline terminates a CSS
    // string per spec, so backslash/quote escaping alone lets everything
    // after the \n become live CSS (a new selector, `.injected`, with
    // attacker-controlled declarations). cssUrl must strip the newline
    // (and CR/FF, which the CSS spec also treats as a newline) so the
    // whole payload stays inert, inside the quoted string.
    let payload =
      '/img/x.jpg\n});} .injected{color:red;background:url(https://evil.example/beacon'
    assert.equal(
      cssUrl(payload),
      'url("/img/x.jpg});} .injected{color:red;background:url(https://evil.example/beacon")',
    )
  })

  it('renders the injection payload inertly, as a single-line background-image declaration, never breaking out into new CSS', async () => {
    let payload =
      '/img/x.jpg\n});} .injected{color:red;background:url(https://evil.example/beacon'
    let post = stub({ image: payload })
    let html = await renderToString(<PostCard post={post} index={0} variant="row" />)
    let sheet = allStyles(html)

    // If the raw \n had survived into the emitted CSS, this declaration
    // would break across two lines and the exact single-line text below
    // (built the same way, via cssUrl) would not appear verbatim -- the
    // payload's own literal "}" and "{" characters would instead have
    // landed outside the quoted string, on their own line, as real CSS.
    let expectedDeclaration = `background-image: ${cssUrl(payload)}`
    assert.ok(sheet.includes(expectedDeclaration))
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
