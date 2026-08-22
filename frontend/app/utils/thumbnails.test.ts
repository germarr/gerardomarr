import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { areaPath, barsPath, cellsPath, lastPoint, linePath } from './thumbnails.ts'

const SERIES = [12, 18, 15, 27, 34, 30, 46, 58, 51, 72, 88, 96]

describe('linePath', () => {
  it('starts at the left pad and ends at the right pad', () => {
    let d = linePath(SERIES, 28)
    assert.equal(d.startsWith('M28.0 '), true)
    assert.equal(d.endsWith('292.0 28.0'), true)
  })

  it('emits one command per point', () => {
    assert.equal(linePath(SERIES, 28).split(' L').length, SERIES.length)
  })

  it('throws when given fewer than two values', () => {
    assert.throws(() => linePath([1], 28), /at least 2/)
  })
})

describe('areaPath', () => {
  it('closes the shape along the baseline', () => {
    assert.equal(areaPath(SERIES, 28).endsWith('L292 172 L28 172 Z'), true)
  })

  it('throws when given fewer than two values', () => {
    assert.throws(() => areaPath([1], 28), /at least 2/)
  })
})

describe('barsPath', () => {
  it('emits one closed rect per value', () => {
    let d = barsPath([1, 2, 3], 28, 6)
    assert.equal((d.match(/Z/g) ?? []).length, 3)
  })

  it('makes the tallest bar reach the top pad', () => {
    assert.equal(barsPath([1, 2, 4], 28, 6).includes('M208.0 28.0'), true)
  })

  it('throws when given no values', () => {
    assert.throws(() => barsPath([], 28, 6), /at least 1/)
  })

  it('throws when the maximum is zero', () => {
    assert.throws(() => barsPath([0, 0], 28, 6), /non-zero maximum/)
  })
})

describe('cellsPath', () => {
  it('emits every cell when no filter is given', () => {
    assert.equal((cellsPath(8, 5, 28, null).match(/Z/g) ?? []).length, 40)
  })

  it('emits only the requested cells', () => {
    assert.equal((cellsPath(8, 5, 28, [0, 3, 9]).match(/Z/g) ?? []).length, 3)
  })
})

describe('lastPoint', () => {
  it('lands on the final plotted point', () => {
    let point = lastPoint(SERIES, 28)
    assert.equal(point.x, '292.0')
    assert.equal(point.y, '28.0')
  })

  it('tracks a series that does not peak last', () => {
    assert.equal(lastPoint([10, 90, 50], 28).y, '100.0')
  })

  it('throws when given no values', () => {
    assert.throws(() => lastPoint([], 28), /at least 1/)
  })
})
