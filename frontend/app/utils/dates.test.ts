import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { formatPostDate } from './dates.ts'

describe('formatPostDate', () => {
  it('formats as uppercase month, day, year', () => {
    assert.equal(formatPostDate('2026-08-14'), 'AUG 14 2026')
  })

  it('does not pad the day', () => {
    assert.equal(formatPostDate('2026-01-05'), 'JAN 5 2026')
  })

  it('throws on a malformed date', () => {
    assert.throws(() => formatPostDate('14/08/2026'), /YYYY-MM-DD/)
  })

  it('throws on a month outside 1-12', () => {
    assert.throws(() => formatPostDate('2026-13-01'), /YYYY-MM-DD/)
    assert.throws(() => formatPostDate('2026-00-10'), /YYYY-MM-DD/)
  })
})
