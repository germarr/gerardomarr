import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { marked } from 'marked'
import { createElement } from 'remix/ui'
import { renderToString } from 'remix/ui/server'

import { ArticleBody, inlineTokensOf } from './article-body.tsx'

describe('inlineTokensOf', () => {
  it('unwraps the extra text layer inside a list item', () => {
    let list = marked.lexer('- an item with `code`\n').find((t) => t.type === 'list') as any
    let inline = inlineTokensOf(list.items[0])
    assert.equal(inline.some((token: any) => token.type === 'codespan'), true)
  })

  it('returns inline tokens of a paragraph unchanged', () => {
    let para = marked.lexer('plain **bold** text').find((t) => t.type === 'paragraph') as any
    assert.equal(inlineTokensOf(para).some((token: any) => token.type === 'strong'), true)
  })
})

function tokensFor(markdown: string): any[] {
  return marked.lexer(markdown).filter((token) => token.type !== 'space')
}

async function renderTokens(markdown: string): Promise<string> {
  let tokens = tokensFor(markdown)
  return await renderToString(createElement(ArticleBody, { tokens }))
}

describe('ArticleBody tables', () => {
  it('renders a two-column, two-row table with the right number of th/td and cell text', async () => {
    let html = await renderTokens(
      ['| Channel | Spend |', '|---|---|', '| Search | 1200 |', '| Social | 800 |', ''].join('\n'),
    )

    assert.match(html, /<table/)
    let thCount = (html.match(/<th[ >]/g) ?? []).length
    let tdCount = (html.match(/<td[ >]/g) ?? []).length
    assert.equal(thCount, 2)
    assert.equal(tdCount, 4)
    assert.match(html, />Channel</)
    assert.match(html, />Spend</)
    assert.match(html, />Search</)
    assert.match(html, />1200</)
    assert.match(html, />Social</)
    assert.match(html, />800</)
  })

  it('preserves inline formatting inside cells', async () => {
    let html = await renderTokens(['| Metric | Value |', '|---|---|', '| **Total** | `42` |', ''].join('\n'))

    assert.match(html, /<strong[^>]*>Total<\/strong>/)
    assert.match(html, /<code[^>]*>42<\/code>/)
  })

  it('carries column alignment from |:---|---:| into the rendered cells', async () => {
    let html = await renderTokens(['| Left | Right |', '|:---|---:|', '| a | b |', ''].join('\n'))

    // Styles are emitted as classes on the element plus rules in a <style> sheet
    // (this file's existing convention), not inline `style=` attributes, so
    // resolve each cell's class to its rule and check `text-align` there.
    function textAlignOf(cellHtml: string): string {
      let classMatch = /class="([^"]+)"/.exec(cellHtml)
      assert.ok(classMatch)
      let cls = classMatch![1]!.split(' ')[0]!
      let ruleMatch = new RegExp(`\\.${cls}\\s*\\{[^}]*text-align:\\s*(left|right|center)`).exec(html)
      assert.ok(ruleMatch)
      return ruleMatch![1]!
    }

    let leftTh = /<th[^>]*>Left</.exec(html)
    let rightTh = /<th[^>]*>Right</.exec(html)
    let rightTd = /<td[^>]*>b</.exec(html)
    assert.ok(leftTh)
    assert.ok(rightTh)
    assert.ok(rightTd)
    assert.equal(textAlignOf(leftTh![0]!), 'left')
    assert.equal(textAlignOf(rightTh![0]!), 'right')
    assert.equal(textAlignOf(rightTd![0]!), 'right')
  })

  it('wraps the table in a scrollable container so a wide table cannot widen the article column', async () => {
    let html = await renderTokens(['| A | B |', '|---|---|', '| a | b |', ''].join('\n'))

    assert.match(html, /overflow-x:\s*auto/)
    // the overflow wrapper must be a div that contains the table, not applied to <table> itself
    assert.match(html, /<div[^>]*class="[^"]*"[^>]*><table/)
  })
})
