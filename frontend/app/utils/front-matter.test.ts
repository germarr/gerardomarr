import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { parseFrontMatter } from './front-matter.ts'

const SAMPLE = `---
title:   "Modelling messy data"
hook:    "What survives contact with reality."
date:    2026-08-14
minutes: 7
tags:    [mmm, marketing-science]
image:   ""
---

Body starts here.

## A heading
`

describe('parseFrontMatter', () => {
  it('parses every field', () => {
    let { frontMatter } = parseFrontMatter(SAMPLE, 'a.md')
    assert.equal(frontMatter.title, 'Modelling messy data')
    assert.equal(frontMatter.hook, 'What survives contact with reality.')
    assert.equal(frontMatter.date, '2026-08-14')
    assert.equal(frontMatter.minutes, 7)
    assert.deepEqual(frontMatter.tags, ['mmm', 'marketing-science'])
    assert.equal(frontMatter.image, '')
  })

  it('returns the body without the front matter', () => {
    let { body } = parseFrontMatter(SAMPLE, 'a.md')
    assert.equal(body.startsWith('Body starts here.'), true)
    assert.equal(body.includes('title:'), false)
  })

  it('throws naming the file when the block is missing', () => {
    assert.throws(() => parseFrontMatter('no front matter here', 'broken.md'), /broken\.md/)
  })

  it('throws naming the missing field', () => {
    let missing = `---\ntitle: "T"\nhook: "H"\ndate: 2026-01-01\ntags: []\nimage: ""\n---\nbody\n`
    assert.throws(() => parseFrontMatter(missing, 'nomin.md'), /minutes/)
  })

  it('handles an empty tag list', () => {
    let empty = SAMPLE.replace('[mmm, marketing-science]', '[]')
    assert.deepEqual(parseFrontMatter(empty, 'a.md').frontMatter.tags, [])
  })

  it('returns an empty body when nothing follows the closing delimiter', () => {
    let noBody = `---\ntitle: "T"\nhook: "H"\ndate: 2026-01-01\nminutes: 3\ntags: []\nimage: ""\n---`
    let { body } = parseFrontMatter(noBody, 'nobody.md')
    assert.equal(body, '')
  })

  it('throws on an unterminated quote', () => {
    let bad = `---\ntitle: "Data: a story\nhook: "H"\ndate: 2026-01-01\nminutes: 3\ntags: []\nimage: ""\n---\nbody\n`
    assert.throws(() => parseFrontMatter(bad, 'a.md'), /title.*unterminated quote/)
  })

  it('throws when tags is not a bracketed list', () => {
    let bad = SAMPLE.replace('tags:    [mmm, marketing-science]', 'tags:    mmm, marketing-science')
    assert.throws(() => parseFrontMatter(bad, 'a.md'), /tags.*inline list/)
  })

  it('keeps quoted tag entries with commas intact', () => {
    let source = SAMPLE.replace('[mmm, marketing-science]', '["mmm, marketing-science", other]')
    let { frontMatter } = parseFrontMatter(source, 'a.md')
    assert.deepEqual(frontMatter.tags, ['mmm, marketing-science', 'other'])
  })

  it('throws on a duplicate key', () => {
    let dup = `---\ntitle: "T"\ntitle: "T2"\nhook: "H"\ndate: 2026-01-01\nminutes: 3\ntags: []\nimage: ""\n---\nbody\n`
    assert.throws(() => parseFrontMatter(dup, 'a.md'), /duplicate.*title/)
  })

  it('throws when minutes has trailing non-numeric text', () => {
    let bad = SAMPLE.replace('minutes: 7', 'minutes: 7 minutes')
    assert.throws(() => parseFrontMatter(bad, 'a.md'), /minutes/)
  })
})
