import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { renderToString } from 'remix/ui/server'

import { SectionRule } from './section-rule.tsx'

/** Inner text of every top-level <span> inside the rendered row, in DOM order. */
function spanTexts(html: string): string[] {
  let row = /<div[^>]*>([\s\S]*)<\/div>/.exec(html)
  assert.ok(row)
  return [...row![1]!.matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]!)
}

describe('SectionRule', () => {
  it('numbered: renders number, then the hairline, then the label -- in that order', async () => {
    let html = await renderToString(<SectionRule number="01" label="ABOUT" />)
    assert.deepEqual(spanTexts(html), ['01', '', 'ABOUT'])
  })

  it('unnumbered: renders the label first, then the hairline, with no number span at all', async () => {
    let html = await renderToString(<SectionRule label="FILTER BY STACK" />)
    assert.deepEqual(spanTexts(html), ['FILTER BY STACK', ''])
  })

  it('numbered with trailing: trailing lands last, after number, hairline, label', async () => {
    let html = await renderToString(<SectionRule number="04" label="ELSEWHERE" trailing="04 / 04" />)
    assert.deepEqual(spanTexts(html), ['04', '', 'ELSEWHERE', '04 / 04'])
  })

  it('unnumbered with trailing: trailing lands last, after label, hairline', async () => {
    let html = await renderToString(
      <SectionRule label="FILTER BY STACK" trailing="04 / 04" />,
    )
    assert.deepEqual(spanTexts(html), ['FILTER BY STACK', '', '04 / 04'])
  })

  it('omits the trailing span entirely when trailing is absent', async () => {
    let html = await renderToString(<SectionRule number="01" label="ABOUT" />)
    assert.equal(html.includes('04 / 04'), false)
    assert.equal(spanTexts(html).length, 3)
  })

  it('marks the ordinal aria-hidden, since it duplicates the label and would otherwise be read aloud as "zero one"', async () => {
    let html = await renderToString(<SectionRule number="01" label="ABOUT" />)
    assert.match(html, /<span aria-hidden="true"[^>]*>01<\/span>/)
  })

  it('by default (no `heading`) renders the label as a plain <span>, not a heading', async () => {
    let html = await renderToString(<SectionRule number="01" label="ABOUT" />)
    assert.equal(/<h[1-6][^>]*>ABOUT<\/h[1-6]>/.test(html), false)
    assert.match(html, /<span[^>]*>ABOUT<\/span>/)
  })

  it('with `heading`, renders the label as an <h2>, not a <span>, while keeping the ordinal a plain (aria-hidden) span', async () => {
    let html = await renderToString(<SectionRule number="01" label="ABOUT" heading />)
    assert.match(html, /<h2[^>]*>ABOUT<\/h2>/)
    assert.equal(html.includes('<span>ABOUT</span>'), false)
    assert.match(html, /<span aria-hidden="true"[^>]*>01<\/span>/)
  })

  it('with `heading` and no number, renders the (only) label as an <h2>', async () => {
    let html = await renderToString(<SectionRule label="EARLIER" heading />)
    assert.match(html, /<h2[^>]*>EARLIER<\/h2>/)
  })

  it('the label keeps the same class -- and so the same emitted CSS rule -- whether rendered as a <span> or an <h2>: switching tags must not move a pixel', async () => {
    let spanHtml = await renderToString(<SectionRule number="01" label="ABOUT" />)
    let h2Html = await renderToString(<SectionRule number="01" label="ABOUT" heading />)

    let spanClass = /<span[^>]*class="([^"]+)"[^>]*>ABOUT<\/span>/.exec(spanHtml)?.[1]
    let h2Class = /<h2[^>]*class="([^"]+)"[^>]*>ABOUT<\/h2>/.exec(h2Html)?.[1]
    assert.ok(spanClass)
    assert.ok(h2Class)
    assert.equal(spanClass, h2Class)

    function ruleFor(className: string, html: string): string | undefined {
      let sheet = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
      return new RegExp(`\\.${className}\\s*\\{[^}]*\\}`).exec(sheet)?.[0]
    }

    assert.equal(ruleFor(spanClass!, spanHtml), ruleFor(h2Class!, h2Html))
  })
})
