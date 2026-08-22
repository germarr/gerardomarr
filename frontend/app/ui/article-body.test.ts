import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { marked } from 'marked'

import { inlineTokensOf } from './article-body.tsx'

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
