import type { Handle, RemixNode } from 'remix/ui'
import { css } from 'remix/ui'

type CSSProps = Parameters<typeof css>[0]

import { entryHref, entryPreloads } from '../assets.ts'
import { FONTS_HREF, pageBase, themeTokens } from '../ui/theme.ts'

export interface DocumentProps {
  children?: RemixNode
  title?: string
  description?: string
}

/**
 * Applies the stored theme before first paint so there is no flash. Runs
 * inline in <head>, before <body> exists, so it writes to documentElement.
 */
const NO_FLASH = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let { children, title = 'Gerardo Martinez', description } = handle.props

    return (
      <html lang="en" data-theme="light" mix={css(themeTokens as CSSProps)}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          {description ? <meta name="description" content={description} /> : null}
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={FONTS_HREF} />
          <script>{NO_FLASH}</script>
          {entryPreloads.map((href) => (
            <link key={href} rel="modulepreload" href={href} />
          ))}
          <script type="module" src={entryHref}></script>
        </head>
        <body mix={css(pageBase)}>{children}</body>
      </html>
    )
  }
}
