import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { nextTheme } from './theme-toggle.tsx'

describe('nextTheme', () => {
  it('flips light to dark', () => {
    assert.equal(nextTheme('light'), 'dark')
  })

  it('flips dark to light', () => {
    assert.equal(nextTheme('dark'), 'light')
  })

  it('treats null as dark (server default is light, so the other theme is dark)', () => {
    assert.equal(nextTheme(null), 'dark')
  })

  it('treats any unrecognised value as dark', () => {
    assert.equal(nextTheme('sepia'), 'dark')
    assert.equal(nextTheme(''), 'dark')
  })
})
