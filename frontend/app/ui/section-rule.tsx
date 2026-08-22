import { css, type Handle } from 'remix/ui'

export interface SectionRuleProps {
  /** Two-digit ordinal, e.g. "01". Omit for an unnumbered rule. */
  number?: string
  label: string
  /** Optional right-hand text, e.g. "04 / 04". */
  trailing?: string
}

export function SectionRule(handle: Handle<SectionRuleProps>) {
  return () => {
    let { number, label, trailing } = handle.props

    return (
      <div mix={rowStyle}>
        {number ? <span mix={numberStyle}>{number}</span> : <span mix={labelStyle}>{label}</span>}
        <span mix={hairlineStyle} />
        {number ? <span mix={labelStyle}>{label}</span> : null}
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
