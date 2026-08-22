import type { Handle } from 'remix/ui'
import { css } from 'remix/ui'

import type { Post } from '../../data/posts.ts'
import { centeredColumnBase, CONTENT_MAX, promptLineStyle } from '../../ui/page-layout.ts'
import { PostCard } from '../../ui/post-card.tsx'
import { SectionRule } from '../../ui/section-rule.tsx'
import { Shell } from '../../ui/shell.tsx'

export interface WritingPageProps {
  posts: Post[]
}

function pad2(n: number): string {
  return (n < 10 ? '0' : '') + n
}

export function WritingPage(handle: Handle<WritingPageProps>) {
  return () => {
    let { posts } = handle.props
    let [featured, ...rest] = posts

    return (
      <Shell
        section="writing"
        title="Writing"
        description="Notes on modelling messy, real-world data — and on the part nobody writes about, which is getting a model used by people who did not build it."
      >
        <section aria-label="Writing" mix={headerSectionStyle}>
          <div mix={headerInnerStyle}>
            <span mix={promptLineStyle}>$ ls posts/*.md</span>
            <h1 mix={titleStyle}>Writing</h1>
            <p mix={introStyle}>
              Notes on modelling messy, real-world data — and on the part nobody writes about,
              which is getting a model used by people who did not build it.
            </p>
          </div>
        </section>

        {featured ? (
          <section aria-label="Latest post" mix={featuredSectionStyle}>
            <div mix={featuredInnerStyle}>
              <PostCard post={featured} index={0} variant="featured" />
            </div>
          </section>
        ) : null}

        {rest.length > 0 ? (
          <section aria-label="Earlier posts" mix={archiveSectionStyle}>
            <div mix={archiveInnerStyle}>
              <SectionRule label="EARLIER" trailing={`${pad2(rest.length)} POSTS`} heading />

              <div mix={listStyle}>
                {rest.map((post, i) => (
                  <PostCard key={post.slug} post={post} index={i + 1} variant="row" />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {posts.length === 0 ? (
          <section aria-label="Writing" mix={archiveSectionStyle}>
            <div mix={emptyStyle}>no posts yet</div>
          </section>
        ) : null}
      </Shell>
    )
  }
}

const headerSectionStyle = css({
  padding: '72px 48px 44px',
  '@media (max-width: 720px)': { padding: '44px 20px 28px' },
})

const headerInnerStyle = css({ ...centeredColumnBase, gap: '26px' })

const titleStyle = css({
  margin: 0,
  fontSize: '54px',
  lineHeight: 1.02,
  letterSpacing: '-0.028em',
  fontWeight: 600,
  color: 'var(--ink)',
  '@media (max-width: 720px)': { fontSize: '38px' },
})

const introStyle = css({
  margin: 0,
  maxWidth: '62ch',
  fontSize: '14.5px',
  lineHeight: 1.75,
  color: 'var(--ink-2)',
  textWrap: 'pretty',
})

const featuredSectionStyle = css({
  padding: '0 48px 56px',
  '@media (max-width: 720px)': { padding: '0 20px 40px' },
})

const featuredInnerStyle = css({
  maxWidth: CONTENT_MAX,
  margin: '0 auto',
})

const archiveSectionStyle = css({
  padding: '0 48px 88px',
  '@media (max-width: 720px)': { padding: '0 20px 56px' },
})

const archiveInnerStyle = css({ ...centeredColumnBase, gap: '22px' })

const listStyle = css({
  display: 'flex',
  flexDirection: 'column',
  borderBottom: '1px solid var(--rule)',
})

const emptyStyle = css({
  maxWidth: CONTENT_MAX,
  margin: '0 auto',
  padding: '56px 0',
  textAlign: 'center',
  color: 'var(--ink-3)',
  fontSize: '13px',
  letterSpacing: '0.06em',
})
