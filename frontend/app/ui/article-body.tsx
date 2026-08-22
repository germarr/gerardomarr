import { css, type Handle } from 'remix/ui'
import type { Token } from 'marked'

import { FONT_MONO, FONT_SANS } from './theme.ts'

/**
 * Inline tokens for a block. List items wrap their inline content in an extra
 * `text` token, so descend one level when that is what we are given.
 */
export function inlineTokensOf(token: any): any[] {
  let tokens: any[] = token?.tokens ?? []
  if (tokens.length === 1 && tokens[0]?.type === 'text' && Array.isArray(tokens[0]?.tokens)) {
    return tokens[0].tokens
  }
  return tokens
}

export function ArticleBody(handle: Handle<{ tokens: Token[] }>) {
  return () => (
    <article mix={articleStyle}>
      {handle.props.tokens.map((token, index) => (
        <BlockToken key={index} token={token} />
      ))}
    </article>
  )
}

function BlockToken(handle: Handle<{ token: any }>) {
  return () => {
    let token = handle.props.token

    switch (token.type) {
      case 'heading': {
        let inline = inlineTokensOf(token)
        return token.depth <= 2 ? (
          <h2 id={token.id} mix={h2Style}>
            <InlineTokens tokens={inline} />
          </h2>
        ) : (
          <h3 id={token.id} mix={h3Style}>
            <InlineTokens tokens={inline} />
          </h3>
        )
      }
      case 'paragraph':
        return (
          <p mix={paragraphStyle}>
            <InlineTokens tokens={inlineTokensOf(token)} />
          </p>
        )
      case 'list': {
        let items = (token.items ?? []).map((item: any, index: number) => (
          <li key={index}>
            <InlineTokens tokens={inlineTokensOf(item)} />
          </li>
        ))
        return token.ordered ? (
          <ol mix={olStyle}>{items}</ol>
        ) : (
          <ul mix={ulStyle}>{items}</ul>
        )
      }
      case 'blockquote':
        return (
          <blockquote mix={blockquoteStyle}>
            {(token.tokens ?? []).map((child: any, index: number) => (
              <BlockToken key={index} token={child} />
            ))}
          </blockquote>
        )
      case 'code':
        return (
          <pre mix={preStyle}>
            <code>{token.text}</code>
          </pre>
        )
      case 'hr':
        return <div mix={hrStyle} />
      case 'table': {
        let align: (string | null)[] = token.align ?? []
        let headerCells = (token.header ?? []).map((cell: any, columnIndex: number) => (
          <th key={columnIndex} mix={css({ ...thBaseProps, textAlign: align[columnIndex] ?? 'left' })}>
            <InlineTokens tokens={inlineTokensOf(cell)} />
          </th>
        ))
        let bodyRows = (token.rows ?? []).map((row: any[], rowIndex: number) => (
          <tr key={rowIndex}>
            {row.map((cell: any, columnIndex: number) => (
              <td key={columnIndex} mix={css({ ...tdBaseProps, textAlign: align[columnIndex] ?? 'left' })}>
                <InlineTokens tokens={inlineTokensOf(cell)} />
              </td>
            ))}
          </tr>
        ))
        return (
          <div mix={tableWrapperStyle}>
            <table mix={tableStyle}>
              <thead>
                <tr>{headerCells}</tr>
              </thead>
              <tbody>{bodyRows}</tbody>
            </table>
          </div>
        )
      }
      default:
        console.warn(`ArticleBody: no renderer for markdown block type "${token.type}" - it will not appear on the page`)
        return null
    }
  }
}

function InlineTokens(handle: Handle<{ tokens: any[] }>) {
  return () => (
    <>
      {handle.props.tokens.map((token, index) => (
        <InlineToken key={index} token={token} />
      ))}
    </>
  )
}

function InlineToken(handle: Handle<{ token: any }>) {
  return () => {
    let token = handle.props.token

    switch (token.type) {
      case 'strong':
        return (
          <strong mix={strongStyle}>
            <InlineTokens tokens={inlineTokensOf(token)} />
          </strong>
        )
      case 'em':
        return (
          <em>
            <InlineTokens tokens={inlineTokensOf(token)} />
          </em>
        )
      case 'codespan':
        return <code mix={codespanStyle}>{token.text}</code>
      case 'link':
        return (
          <a href={token.href} title={token.title ?? undefined} mix={linkStyle}>
            <InlineTokens tokens={inlineTokensOf(token)} />
          </a>
        )
      case 'image':
        return <img src={token.href} alt={token.text} title={token.title ?? undefined} mix={imageStyle} />
      case 'br':
        return <br />
      default:
        return <>{token.text}</>
    }
  }
}

const articleStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
  fontFamily: FONT_SANS,
  fontSize: '17px',
  lineHeight: 1.75,
  color: 'var(--ink-2)',
  maxWidth: '68ch',
})

const h2Style = css({
  margin: '20px 0 0',
  fontFamily: FONT_MONO,
  fontSize: '22px',
  lineHeight: 1.3,
  letterSpacing: '-0.015em',
  fontWeight: 600,
  color: 'var(--ink)',
})

const h3Style = css({
  margin: '16px 0 0',
  fontFamily: FONT_MONO,
  fontSize: '16px',
  lineHeight: 1.4,
  letterSpacing: '0.02em',
  fontWeight: 600,
  color: 'var(--ink)',
})

const paragraphStyle = css({
  margin: 0,
  textWrap: 'pretty',
})

const ulStyle = css({
  margin: 0,
  paddingLeft: '22px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
})

const olStyle = css({
  margin: 0,
  paddingLeft: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
})

const blockquoteStyle = css({
  margin: '12px 0',
  padding: '0 0 0 26px',
  borderLeft: '2px solid var(--accent)',
  fontFamily: FONT_MONO,
  fontSize: '19px',
  lineHeight: 1.55,
  color: 'var(--ink)',
})

const preStyle = css({
  margin: 0,
  padding: '20px 22px',
  background: 'var(--paper-2)',
  border: '1px solid var(--rule)',
  overflowX: 'auto',
  fontFamily: FONT_MONO,
  fontSize: '13.5px',
  lineHeight: 1.7,
  color: 'var(--ink)',
})

const hrStyle = css({
  height: '1px',
  background: 'var(--rule)',
  margin: '20px 0',
})

const strongStyle = css({
  color: 'var(--ink)',
  fontWeight: 600,
})

const codespanStyle = css({
  fontFamily: FONT_MONO,
  fontSize: '14.5px',
  padding: '2px 6px',
  background: 'var(--accent-wash)',
  color: 'var(--ink)',
})

const linkStyle = css({
  borderBottom: '1px solid var(--accent)',
  transition: 'color 140ms ease',
  '&:hover': { color: 'var(--ink)' },
})

const imageStyle = css({
  maxWidth: '100%',
  height: 'auto',
  border: '1px solid var(--rule)',
})

const tableWrapperStyle = css({
  overflowX: 'auto',
})

const tableStyle = css({
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: FONT_MONO,
  fontSize: '13.5px',
  lineHeight: 1.6,
})

const thBaseProps = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--rule-2)',
  color: 'var(--ink)',
  fontWeight: 600,
  letterSpacing: '0.04em',
}

const tdBaseProps = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--rule)',
  color: 'var(--ink-2)',
}
