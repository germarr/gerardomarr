import * as path from 'node:path'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { marked } from 'marked'
import { createElement } from 'remix/ui'
import { renderToString } from 'remix/ui/server'

import { loadPosts } from '../data/posts.ts'
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

const COLLISION_FIXTURES = path.resolve(
  import.meta.dirname,
  '../../test/fixtures/posts-heading-collisions',
)

describe('ArticleBody heading id contract', () => {
  it('renders each heading with the id readPost assigned, including the de-dup suffix, not a recomputed one', async () => {
    let post = loadPosts(COLLISION_FIXTURES)[0]!
    let html = await renderToString(createElement(ArticleBody, { tokens: post.tokens }))
    let emittedIds = [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((match) => match[1])
    assert.deepEqual(emittedIds, post.contents.map((entry) => entry.id))
  })
})

describe('ArticleBody heading depth mapping', () => {
  it('renders depth 1 and 2 as h2, depth 3 and deeper as h3', async () => {
    let html = await renderTokens('# One\n\n## Two\n\n### Three\n\n#### Four\n')
    assert.match(html, /<h2[^>]*>One<\/h2>/)
    assert.match(html, /<h2[^>]*>Two<\/h2>/)
    assert.match(html, /<h3[^>]*>Three<\/h3>/)
    assert.match(html, /<h3[^>]*>Four<\/h3>/)
  })
})

describe('ArticleBody block renderers', () => {
  it('renders paragraph, list, blockquote, code, and hr as their expected tags', async () => {
    let md = [
      'A paragraph.',
      '',
      '- one',
      '- two',
      '- three',
      '',
      '1. first',
      '2. second',
      '',
      '> quoted paragraph',
      '',
      '```',
      'code line',
      '```',
      '',
      '---',
      '',
    ].join('\n')
    let html = await renderTokens(md)

    assert.match(html, /<p[^>]*>A paragraph\.<\/p>/)

    let ulMatch = /<ul[^>]*>([\s\S]*?)<\/ul>/.exec(html)
    assert.ok(ulMatch)
    assert.equal((ulMatch![1]!.match(/<li>/g) ?? []).length, 3)

    assert.match(html, /<ol[^>]*>[\s\S]*<\/ol>/)

    let blockquoteMatch = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/.exec(html)
    assert.ok(blockquoteMatch)
    assert.match(blockquoteMatch![1]!, /<p[^>]*>quoted paragraph<\/p>/)

    assert.match(html, /<pre[^>]*><code>code line<\/code><\/pre>/)

    // the hr rule element: an empty, styled div with no text content
    assert.match(html, /<div class="[^"]+"><\/div>/)
  })
})

describe('ArticleBody unknown block types', () => {
  it('warns once, naming the unhandled type, instead of failing silently', async () => {
    let originalWarn = console.warn
    let calls: unknown[][] = []
    console.warn = (...args: unknown[]) => {
      calls.push(args)
    }
    try {
      await renderTokens('<div>raw html block</div>\n')
      assert.equal(calls.length, 1)
      assert.match(String(calls[0]![0]), /no renderer for markdown block type "html"/)
    } finally {
      console.warn = originalWarn
    }
  })
})
