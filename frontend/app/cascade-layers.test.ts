import * as fs from 'node:fs'
import * as path from 'node:path'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

/**
 * Repo-wide guard against a defect that silently disabled every hover effect
 * on this site.
 *
 * `mix={css({...})}` wraps each component's styles in its own `@layer`, and
 * layer order follows render order -- so a child component's layer is always
 * declared AFTER its parent's. CSS cascade layers give priority to the later
 * layer regardless of selector specificity. A parent's `'&:hover .card-name'`
 * rule therefore loses to the child's own `color`, and does nothing at all.
 *
 * The rules still compile and still appear in the emitted stylesheet, so two
 * separate code reviews confirmed "the CSS is there" and both missed it. Only
 * measuring computed styles in a real browser caught it.
 *
 * The fix is to have the parent set an inherited custom property on its OWN
 * `:hover` and the child consume it with a fallback:
 *
 *   parent:  '&:hover': { '--card-name-color': 'var(--accent)' }
 *   child:   color: 'var(--card-name-color, var(--ink))'
 *
 * Self-targeting selectors (`&:hover`, `&[data-theme="dark"]`, `&:focus`) are
 * fine -- they style the element the layer belongs to. Only selectors reaching
 * into a DESCENDANT are broken, and that is what this test forbids.
 */

const APP_DIR = path.resolve(import.meta.dirname)

function sourceFiles(dir: string): string[] {
  let out: string[] = []
  for (let entry of fs.readdirSync(dir, { withFileTypes: true })) {
    let full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...sourceFiles(full))
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

/**
 * Style keys like '&:hover .child' or '& .child' -- a descendant combinator.
 *
 * A line carrying `cascade-layer-base` is exempt. That marker is for base or
 * reset rules which deliberately want to LOSE to a component's own styles --
 * the body's default link colour, for instance, should apply only where a
 * component has not set its own. Those are the safe direction of this hazard.
 */
function descendantSelectors(source: string): string[] {
  let found: string[] = []
  let keyPattern = /['"](&[^'"]*)['"]\s*:/g
  let match: RegExpExecArray | null
  while ((match = keyPattern.exec(source))) {
    let lineStart = source.lastIndexOf('\n', match.index) + 1
    let lineEnd = source.indexOf('\n', match.index)
    let line = source.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)
    if (line.includes('cascade-layer-base')) continue

    // A comma list ('&[aria-current], &:focus') targets the same element
    // repeatedly; collapse it before looking for a real space combinator.
    let key = match[1]!.replace(/,\s*/g, ',')
    if (/\s/.test(key)) found.push(match[1]!)
  }
  return found
}

describe('cascade layers', () => {
  it('no component styles a descendant from its own css() call', () => {
    let offenders: string[] = []
    for (let file of sourceFiles(APP_DIR)) {
      let source = fs.readFileSync(file, 'utf8')
      for (let selector of descendantSelectors(source)) {
        offenders.push(`${path.relative(APP_DIR, file)}: ${selector}`)
      }
    }
    assert.equal(
      offenders.length,
      0,
      `Descendant selectors in css() silently do nothing across layers.\n` +
        `Use an inherited custom property instead. Offenders:\n  ` +
        offenders.join('\n  '),
    )
  })
})
