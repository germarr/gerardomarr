import { css, type Handle } from 'remix/ui'

export interface SectionRuleProps {
  /** Two-digit ordinal, e.g. "01". Omit for an unnumbered rule. */
  number?: string
  label: string
  /** Optional right-hand text, e.g. "04 / 04". */
  trailing?: string
  /**
   * Render the label as a real `<h2>` instead of a decorative `<span>`.
   * Use this for rules that mark a genuine page section (e.g. "01 ABOUT").
   * Leave it off for rules that label a control group rather than a
   * content section (e.g. "FILTER BY STACK") -- label that some other,
   * more accurate way instead. `labelStyle` carries the same font-size,
   * weight, letter-spacing, colour and margin either way, so switching
   * tags does not move anything visually.
   */
  heading?: boolean
}

export function SectionRule(handle: Handle<SectionRuleProps>) {
  return () => {
    let { number, label, trailing, heading } = handle.props
    let LabelTag: 'h2' | 'span' = heading ? 'h2' : 'span'

    return (
      <div mix={rowStyle}>
        {number ? (
          <span aria-hidden="true" mix={numberStyle}>
            {number}
          </span>
        ) : (
          <LabelTag mix={labelStyle}>{label}</LabelTag>
        )}
        <span mix={hairlineStyle} />
        {number ? <LabelTag mix={labelStyle}>{label}</LabelTag> : null}
        {trailing ? <span mix={trailingStyle}>{trailing}</span> : null}
      </div>
    )
  }
}

const rowStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
})

const numberStyle = css({
  color: 'var(--accent)',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.1em',
})

const hairlineStyle = css({
  flexGrow: 1,
  height: '1px',
  background: 'var(--rule)',
})

const labelStyle = css({
  margin: 0,
  color: 'var(--ink-3)',
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.2em',
})

const trailingStyle = css({
  color: 'var(--ink-3)',
  fontSize: '11.5px',
  letterSpacing: '0.1em',
})
