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
})
