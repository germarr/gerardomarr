import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { themeTokens } from './theme.ts'

describe('themeTokens', () => {
  it('defines the light palette on the element itself', () => {
    assert.equal(themeTokens['--paper'], 'oklch(0.973 0.006 85)')
    assert.equal(themeTokens['--accent'], 'oklch(0.575 0.155 42)')
  })

  it('overrides every token in dark mode with a different value', () => {
    let dark = themeTokens['&[data-theme="dark"]'] as Record<string, string>
    let lightKeys = Object.keys(themeTokens).filter((key) => key.startsWith('--'))
    assert.equal(lightKeys.length, 10)
    for (let key of lightKeys) {
      assert.equal(typeof dark[key], 'string')
      assert.notEqual(dark[key], themeTokens[key])
    }
  })
})
