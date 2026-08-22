import { css } from 'remix/ui'

import type { CSSProps } from './theme.ts'

/**
 * Shared page skeleton pieces. These were byte-for-byte duplicated across
 * home-page.tsx, projects-page.tsx, writing-page.tsx and article-page.tsx --
 * extracted here rather than left to triplicate (quadruplicate, really --
 * article-page.tsx had the same CONTENT_MAX the original review didn't call
 * out) further as more pages land.
 *
 * Deliberately NOT extracted: per-section padding (`72px 48px 40px` vs
 * `72px 48px 44px` etc.) and per-column `gap` values. Those genuinely differ
 * page to page and section to section -- forcing them into a shared
 * parameterised shape would be an abstraction over a coincidence, not a
 * duplication. Each page still declares its own padding/gap locally, only
 * spreading `centeredColumnBase` for the maxWidth/margin/display/
 * flexDirection shape that actually is identical everywhere.
 */

/** Max width of the centered content column used by every page. */
export const CONTENT_MAX = '1080px'

/** The `$ ...` prompt-line treatment atop each page header (not used by article-page.tsx, which has no prompt line). */
export const promptLineStyle = css({
  color: 'var(--ink-3)',
  fontSize: '12px',
  letterSpacing: '0.16em',
})

/**
 * Base shape for a centered content column. Spread this into a `css({...})`
 * call and add the section's own `gap` (and anything else that varies):
 *
 * ```ts
 * const innerStyle = css({ ...centeredColumnBase, gap: '34px' })
 * ```
 */
export const centeredColumnBase: CSSProps = {
  maxWidth: CONTENT_MAX,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
}
