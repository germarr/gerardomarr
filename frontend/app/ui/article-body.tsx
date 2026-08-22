import { css, type Handle } from 'remix/ui'
import type { Token, Tokens } from 'marked'

import type { HeadingToken } from '../data/posts.ts'
import { FONT_MONO, FONT_SANS } from './theme.ts'

/**
 * Inline tokens for a block. List items wrap their inline content in an extra
 * `text` token, so descend one level when that is what we are given. The
 * input shape is intentionally irregular across callers (a heading token, a
 * paragraph token, a list item, a table cell, ...), so this deliberately
 * takes `any` rather than forcing every call site into an unsafe cast; the
 * return type is the real `Token[]` that callers actually want.
 */
export function inlineTokensOf(token: any): Token[] {
  let tokens: Token[] = token?.tokens ?? []
  if (tokens.length === 1 && tokens[0]?.type === 'text' && Array.isArray((tokens[0] as any)?.tokens)) {
    return (tokens[0] as any).tokens
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

function BlockToken(handle: Handle<{ token: Token }>) {
  return () => {
    let token = handle.props.token

    switch (token.type) {
      // marked's own `Tokens.Heading` has no `id` field -- `HeadingToken`
      // (from app/data/posts.ts) is the real, de-duplicated-id-bearing type
      // that `readPost` produces, so read through that rather than `any`.
      // This is the one cast in this file that exists specifically so a
      // typo'd or recomputed id fails to compile instead of failing silently.
      case 'heading': {
        let heading = token as HeadingToken
        let inline = inlineTokensOf(heading)
        return heading.depth <= 2 ? (
          <h2 id={heading.id} mix={h2Style}>
            <InlineTokens tokens={inline} />
          </h2>
        ) : (
          <h3 id={heading.id} mix={h3Style}>
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
        let list = token as Tokens.List
        let items = list.items.map((item: Tokens.ListItem, index: number) => (
          <li key={index}>
            <InlineTokens tokens={inlineTokensOf(item)} />
          </li>
        ))
        return list.ordered ? (
          <ol mix={olStyle}>{items}</ol>
        ) : (
          <ul mix={ulStyle}>{items}</ul>
        )
      }
      case 'blockquote': {
        let blockquote = token as Tokens.Blockquote
        return (
          <blockquote mix={blockquoteStyle}>
            {blockquote.tokens.map((child: Token, index: number) => (
              <BlockToken key={index} token={child} />
            ))}
          </blockquote>
        )
      }
      case 'code': {
        let code = token as Tokens.Code
        return (
          <pre mix={preStyle}>
            <code>{code.text}</code>
          </pre>
        )
      }
      case 'hr':
        return <div mix={hrStyle} />
      case 'table': {
        let table = token as Tokens.Table
        let align = table.align
        let headerCells = table.header.map((cell: Tokens.TableCell, columnIndex: number) => (
          <th key={columnIndex} mix={css({ ...thBaseProps, textAlign: align[columnIndex] ?? 'left' })}>
            <InlineTokens tokens={inlineTokensOf(cell)} />
          </th>
        ))
        let bodyRows = table.rows.map((row: Tokens.TableCell[], rowIndex: number) => (
          <tr key={rowIndex}>
            {row.map((cell: Tokens.TableCell, columnIndex: number) => (
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

function InlineTokens(handle: Handle<{ tokens: Token[] }>) {
  return () => (
    <>
      {handle.props.tokens.map((token, index) => (
        <InlineToken key={index} token={token} />
      ))}
    </>
  )
}

function InlineToken(handle: Handle<{ token: Token }>) {
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
      case 'codespan': {
        let codespan = token as Tokens.Codespan
        return <code mix={codespanStyle}>{codespan.text}</code>
      }
      case 'link': {
        let link = token as Tokens.Link
        return (
          <a href={link.href} title={link.title ?? undefined} mix={linkStyle}>
            <InlineTokens tokens={inlineTokensOf(link)} />
          </a>
        )
      }
      case 'image': {
        let image = token as Tokens.Image
        return <img src={image.href} alt={image.text} title={image.title ?? undefined} mix={imageStyle} />
      }
      case 'br':
        return <br />
      default:
        // The leftover members of marked's `Token` union here (`Tokens.Text`,
        // `Tokens.Escape`, `Tokens.Del`, `Tokens.Tag`, `Tokens.Generic`, ...)
        // don't share a single named interface -- some lack `.text` entirely
        // (e.g. `Tokens.Checkbox`) -- so there is no single cast that would be
        // both honest and safe here. Reading `.text` off an untyped view is
        // the deliberate compromise for this one fallback branch.
        return <>{(token as any).text}</>
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
