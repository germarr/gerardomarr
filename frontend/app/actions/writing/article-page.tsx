import type { Handle } from 'remix/ui'
import { css } from 'remix/ui'

import type { Post } from '../../data/posts.ts'
import { routes } from '../../routes.ts'
import { ArrowBack } from '../../ui/icons.tsx'
import { ArticleBody } from '../../ui/article-body.tsx'
import { FONT_SANS } from '../../ui/theme.ts'
import { Shell } from '../../ui/shell.tsx'

const CONTENT_MAX = '1080px'

export interface ArticlePageProps {
  post: Post
}

export function ArticlePage(handle: Handle<ArticlePageProps>) {
  return () => {
    let { post } = handle.props

    let dot = (
      <span mix={css({ width: '3px', height: '3px', background: 'var(--rule-2)' })}></span>
    )

    return (
      <Shell
        section="writing"
        title={post.title}
        description={post.hook}
        backTo={{ href: routes.writing.index.href(), label: 'writing' }}
      >
        <section aria-label="Article header" mix={titleSectionStyle}>
          <div mix={titleInnerStyle}>
            <div mix={metaStyle}>
              <span>{post.displayDate}</span>
              {dot}
              <span>{post.minutes} MIN READ</span>
              {dot}
              <span>{post.sourceFile}</span>
            </div>
            <h1 mix={headingStyle}>{post.title}</h1>
            <p mix={hookStyle}>{post.hook}</p>
            <div mix={tagsStyle}>
              {post.tags.map((tag) => (
                <span key={tag} mix={tagChipStyle}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Article body" mix={bodySectionStyle}>
          <div mix={bodyGridStyle}>
            <ArticleBody tokens={post.tokens} />

            {post.contents.length > 0 ? (
              <aside aria-label="Contents" mix={sidebarStyle}>
                <span mix={sidebarLabelStyle}>CONTENTS</span>
                <span mix={sidebarRuleStyle} />
                <nav mix={sidebarNavStyle}>
                  {post.contents.map((entry) => (
                    <a
                      key={entry.id}
                      href={`#${entry.id}`}
                      mix={css({
                        display: 'block',
                        padding: `7px 0 7px ${entry.depth === 3 ? 20 : 10}px`,
                        fontSize: '11.5px',
                        lineHeight: 1.45,
                        letterSpacing: '0.03em',
                        borderLeft: '2px solid var(--rule)',
                        color: 'var(--ink-3)',
                        transition: 'color 140ms ease, border-color 140ms ease',
                        '&:hover': { color: 'var(--ink)' },
                      })}
                    >
                      {entry.label}
                    </a>
                  ))}
                </nav>
              </aside>
            ) : null}
          </div>
        </section>

        <section aria-label="Article footer" mix={footerSectionStyle}>
          <div mix={footerInnerStyle}>
            <span mix={footerRuleStyle} />
            <a
              href={routes.writing.index.href()}
              mix={css({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--ink)',
                fontSize: '12.5px',
                letterSpacing: '0.07em',
                '&:hover': { '--footer-back-transform': 'translateX(-3px)' },
              })}
            >
              <span
                aria-hidden="true"
                mix={css({
                  display: 'flex',
                  color: 'var(--accent)',
                  transform: 'var(--footer-back-transform, translateX(0))',
                  transition: 'transform 160ms ease',
                })}
              >
                <ArrowBack size={13} />
              </span>
              <span>All writing</span>
            </a>
          </div>
        </section>
      </Shell>
    )
  }
}

const titleSectionStyle = css({
  padding: '80px 48px 44px',
  borderBottom: '1px solid var(--rule)',
  '@media (max-width: 720px)': { padding: '44px 20px 28px' },
})

const titleInnerStyle = css({
  maxWidth: CONTENT_MAX,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
})

const metaStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  color: 'var(--ink-3)',
})

const headingStyle = css({
  margin: 0,
  maxWidth: '22ch',
  fontSize: '52px',
  lineHeight: 1.08,
  letterSpacing: '-0.028em',
  fontWeight: 600,
  color: 'var(--ink)',
  textWrap: 'balance',
  '@media (max-width: 720px)': { fontSize: '34px' },
})

const hookStyle = css({
  margin: 0,
  maxWidth: '60ch',
  fontFamily: FONT_SANS,
  fontSize: '19px',
  lineHeight: 1.6,
  color: 'var(--ink-2)',
  textWrap: 'pretty',
})

const tagsStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '4px',
})

const tagChipStyle = css({
  padding: '4px 8px',
  border: '1px solid var(--rule-2)',
  fontSize: '10px',
  letterSpacing: '0.05em',
  color: 'var(--ink-2)',
})

const bodySectionStyle = css({
  padding: '56px 48px 88px',
  '@media (max-width: 720px)': { padding: '36px 20px 56px' },
})

const bodyGridStyle = css({
  maxWidth: CONTENT_MAX,
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 200px',
  gap: '64px',
  alignItems: 'start',
  '@media (max-width: 980px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
})

const sidebarStyle = css({
  position: 'sticky',
  top: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  '@media (max-width: 980px)': { display: 'none' },
})

const sidebarLabelStyle = css({
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.2em',
  color: 'var(--ink-3)',
})

const sidebarRuleStyle = css({
  height: '1px',
  background: 'var(--rule)',
})

const sidebarNavStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
})

const footerSectionStyle = css({
  padding: '0 48px 64px',
  '@media (max-width: 720px)': { padding: '0 20px 40px' },
})

const footerInnerStyle = css({
  maxWidth: CONTENT_MAX,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
})

const footerRuleStyle = css({
  height: '1px',
  background: 'var(--rule)',
})
