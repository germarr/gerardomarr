import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { themeTokens } from './theme.ts'

/**
 * WCAG contrast guard for the palette.
 *
 * The meta text on this site (dates, read times, hostnames) uses --ink-3 at
 * 9-11.5px, well under WCAG's large-text cutoff, so the applicable bar is
 * 4.5:1 -- and it must clear it against BOTH surfaces, since cards sit on
 * --paper-2 rather than --paper. An earlier palette missed this in both
 * themes; this test exists so it cannot come back unnoticed.
 */

/** oklch -> linear sRGB, via Ottosson's OKLab matrices. */
function oklchToSrgb(l: number, c: number, hDeg: number): number[] {
  let h = (hDeg * Math.PI) / 180
  let a = c * Math.cos(h)
  let b = c * Math.sin(h)
  let lp = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  let mp = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  let sp = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp,
    -1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp,
    -0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp,
  ]
}

function parseOklch(value: string): [number, number, number] {
  let match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(value)
  if (!match) throw new Error(`Not an oklch colour: ${value}`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function luminance(value: string): number {
  let [r, g, b] = oklchToSrgb(...parseOklch(value)).map((channel) =>
    Math.max(0, Math.min(1, channel)),
  )
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(foreground: string, background: string): number {
  let a = luminance(foreground)
  let b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

let light = themeTokens as Record<string, string>
let dark = themeTokens['&[data-theme="dark"]'] as Record<string, string>

const TEXT_ON_SURFACE = ['--ink', '--ink-2', '--ink-3']
const SURFACES = ['--paper', '--paper-2']

describe('palette contrast', () => {
  it('clears 4.5:1 for every text token on every surface, in light mode', () => {
    for (let ink of TEXT_ON_SURFACE) {
      for (let surface of SURFACES) {
        let ratio = contrast(light[ink]!, light[surface]!)
        assert.equal(
          ratio >= 4.5,
          true,
          `light ${ink} on ${surface} is ${ratio.toFixed(2)}:1, needs 4.5:1`,
        )
      }
    }
  })

  it('clears 4.5:1 for every text token on every surface, in dark mode', () => {
    for (let ink of TEXT_ON_SURFACE) {
      for (let surface of SURFACES) {
        let ratio = contrast(dark[ink]!, dark[surface]!)
        assert.equal(
          ratio >= 4.5,
          true,
          `dark ${ink} on ${surface} is ${ratio.toFixed(2)}:1, needs 4.5:1`,
        )
      }
    }
  })

  it('clears 4.5:1 for label text on the accent fill, in both modes', () => {
    let lightRatio = contrast(light['--on-accent']!, light['--accent']!)
    let darkRatio = contrast(dark['--on-accent']!, dark['--accent']!)
    assert.equal(lightRatio >= 4.5, true, `light on-accent is ${lightRatio.toFixed(2)}:1`)
    assert.equal(darkRatio >= 4.5, true, `dark on-accent is ${darkRatio.toFixed(2)}:1`)
  })
})
