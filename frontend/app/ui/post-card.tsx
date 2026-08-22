import { css, type Handle } from 'remix/ui'

import type { Post } from '../data/posts.ts'
import { routes } from '../routes.ts'
import { ArrowOut } from './icons.tsx'

/**
 * `featured` — the lead card at the top of the writing index (one per
 * page). `row` — the archive list on the writing index, and the two picks
 * on the home page. `compact` — the writing entries on the phone-width
 * home layout.
 */
export type PostCardVariant = 'featured' | 'row' | 'compact'

/**
 * Hatch angle and line spacing cycle through 4 steps by `index`, so a list
 * of posts doesn't look repetitive. Lifted from the rendered cards in
 * design/Writing.dc.html (featured + row) and design/HomeMobile.dc.html
 * (compact): the 135deg/45deg steps use 9px spacing and the 90deg/0deg
 * steps use 11px, EXCEPT the featured plate (always rendered at index 0 in
 * every design instance), which uses a wider 10px spacing. The task text
 * doesn't call any of this out, so it's lifted straight from the design.
 */
const HATCH_ANGLES = [135, 45, 90, 0] as const
const HATCH_SPACING = [9, 9, 11, 11] as const

function hatchBackground(variant: PostCardVariant, index: number): string {
  let step = ((index % 4) + 4) % 4
  let angle = HATCH_ANGLES[step]
  let spacing = variant === 'featured' && step === 0 ? 10 : HATCH_SPACING[step]
  return `repeating-linear-gradient(${angle}deg, var(--accent-wash) 0 2px, transparent 2px ${spacing}px)`
}

/**
 * `post.image` is a raw string from front matter, dropped straight into a
 * CSS `url(...)`. Escape backslashes and double quotes, and strip raw
 * newlines (CR, LF, FF), so a stray character in the path can't break out
 * of the quoted string and inject CSS. An unescaped newline terminates a
 * CSS string per spec, so escaping quotes/backslashes alone is not enough.
 */
export function cssUrl(value: string): string {
  return `url("${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\n\r\f]/g, '')}")`
}

/**
 * Lifted from the rendered cards in design/Writing.dc.html (featured, row),
 * design/Main.dc.html (row) and design/HomeMobile.dc.html (compact). Both
 * design/PostCard.dc.html and design/Writing.dc.html render the featured
 * plate's ordinal with a 1.5px stroke, not the 1px the task text states
 * uniformly for all variants -- design wins, row/compact stay at 1px.
 * design/PostCard.dc.html's isolated demo gives the featured content block
 * a uniform "40px" padding, but design/Writing.dc.html (the page this task
 * names as the source) renders it asymmetric, "40px 40px 36px" -- used
 * here since the task says the design wins on disagreement.
 */
const SIZES = {
  featured: {
    plateAspect: '4 / 3',
    plateBackground: 'var(--paper)',
    ordinalSize: '96px',
    ordinalLetterSpacing: '-0.04em' as string | undefined,
    stroke: '1.5px',
    showLatest: true,
    metaSize: '10.5px',
    metaGap: '12px',
    showSourceFile: true,
    titleSize: '32px',
    titleLetterSpacing: '-0.022em',
    titleLine: 1.2 as number | undefined,
    titleBalance: true,
    hookSize: '14.5px',
    hookLine: 1.7,
    hookMaxWidth: undefined as string | undefined,
    showTags: true,
  },
  row: {
    plateAspect: '16 / 10',
    plateBackground: 'var(--paper-2)',
    ordinalSize: '42px',
    ordinalLetterSpacing: '-0.03em' as string | undefined,
    stroke: '1px',
    showLatest: false,
    metaSize: '10.5px',
    metaGap: '12px',
    showSourceFile: true,
    titleSize: '21px',
    titleLetterSpacing: '-0.015em',
    titleLine: undefined as number | undefined,
    titleBalance: false,
    hookSize: '13.5px',
    hookLine: 1.65,
    hookMaxWidth: '62ch' as string | undefined,
    showTags: false,
  },
  compact: {
    plateAspect: '1 / 1',
    plateBackground: 'var(--paper-2)',
    ordinalSize: '28px',
    ordinalLetterSpacing: undefined as string | undefined,
    stroke: '1px',
    showLatest: false,
    metaSize: '9.5px',
    metaGap: '9px',
    showSourceFile: false,
    titleSize: '16px',
    titleLetterSpacing: '-0.012em',
    titleLine: 1.3 as number | undefined,
    titleBalance: false,
    hookSize: '12.5px',
    hookLine: 1.6,
    hookMaxWidth: undefined as string | undefined,
    showTags: false,
  },
} as const

export interface PostCardProps {
  post: Post
  index: number
  variant?: PostCardVariant
  /**
   * Render the post title as a real heading at this depth instead of a
   * decorative `<span>`. Omit to keep the `<span>` -- e.g. any caller that
   * hasn't been given a slot in the page's heading outline.
   */
  headingLevel?: 2 | 3
}

export function PostCard(handle: Handle<PostCardProps>) {
  return () => {
    let { post, index, variant = 'row', headingLevel } = handle.props
    let size = SIZES[variant]
    let ordinal = String(index + 1).padStart(2, '0')
    let hasImage = post.image.length > 0
    let TitleTag: 'h2' | 'h3' | 'span' =
      headingLevel === 2 ? 'h2' : headingLevel === 3 ? 'h3' : 'span'

    let plate = (
      <div
        class="card-plate"
        mix={css({
          position: 'relative',
          aspectRatio: size.plateAspect,
          border: '1px solid var(--rule)',
          background: hasImage ? 'var(--paper-2)' : size.plateBackground,
          backgroundImage: hasImage ? cssUrl(post.image) : hatchBackground(variant, index),
          backgroundSize: hasImage ? 'cover' : undefined,
          backgroundPosition: hasImage ? 'center' : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 160ms ease',
          borderColor: 'var(--card-plate-border-color, var(--rule))',
          borderRight: variant === 'featured' ? '1px solid var(--rule)' : undefined,
        })}
      >
        {hasImage ? null : (
          <span
            aria-hidden="true"
            mix={css({
              fontSize: size.ordinalSize,
              fontWeight: 600,
              letterSpacing: size.ordinalLetterSpacing,
              color: 'var(--paper)',
              WebkitTextStroke: `${size.stroke} var(--accent)`,
            })}
          >
            {ordinal}
          </span>
        )}
        {size.showLatest ? (
          <span
            mix={css({
              position: 'absolute',
              top: '14px',
              left: '16px',
              fontSize: '9.5px',
              letterSpacing: '0.16em',
              color: 'var(--ink-3)',
            })}
          >
            LATEST
          </span>
        ) : null}
      </div>
    )

    let dot = (
      <span mix={css({ width: '3px', height: '3px', background: 'var(--rule-2)' })}></span>
    )

    let meta = (
      <div
        mix={css({
          display: 'flex',
          alignItems: 'center',
          gap: size.metaGap,
          fontSize: size.metaSize,
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
        })}
      >
        <span>{post.displayDate}</span>
        {dot}
        <span>{post.minutes} MIN</span>
        {size.showSourceFile ? (
          <>
            {dot}
            <span>{post.sourceFile}</span>
          </>
        ) : null}
      </div>
    )

    let title = (
      <TitleTag
        class="card-title"
        mix={css({
          margin: 0,
          fontSize: size.titleSize,
          fontWeight: 600,
          lineHeight: size.titleLine,
          letterSpacing: size.titleLetterSpacing,
          color: 'var(--card-title-color, var(--ink))',
          transition: 'color 160ms ease',
          textWrap: size.titleBalance ? 'balance' : undefined,
        })}
      >
        {post.title}
      </TitleTag>
    )

    let hook = (
      <p
        mix={css({
          margin: 0,
          maxWidth: size.hookMaxWidth,
          fontSize: size.hookSize,
          lineHeight: size.hookLine,
          color: 'var(--ink-2)',
          textWrap: 'pretty',
        })}
      >
        {post.hook}
      </p>
    )

    let tags = size.showTags ? (
      <div mix={css({ display: 'flex', flexWrap: 'wrap', gap: '6px' })}>
        {post.tags.map((tag) => (
          <span
            key={tag}
            mix={css({
              padding: '4px 8px',
              border: '1px solid var(--rule-2)',
              fontSize: '10px',
              letterSpacing: '0.05em',
              color: 'var(--ink-2)',
            })}
          >
            {tag}
          </span>
        ))}
      </div>
    ) : null

    let go = (arrowSize: number) => (
      <span
        class="card-go"
        aria-hidden="true"
        mix={css({
          display: 'flex',
          transform: 'var(--card-go-transform, translate(0, 0))',
          transition: 'transform 160ms ease',
        })}
      >
        <ArrowOut size={arrowSize} />
      </span>
    )

    let ariaLabel = `${post.title} (${post.displayDate}, ${post.minutes} min read)`

    if (variant === 'featured') {
      return (
        <a
          href={routes.writing.post.href({ slug: post.slug })}
          aria-label={ariaLabel}
          mix={css({
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)',
            border: '1px solid var(--rule)',
            background: 'var(--paper-2)',
            transition: 'border-color 160ms ease',
            '&:hover': {
              borderColor: 'var(--accent)',
              '--card-title-color': 'var(--accent)',
              '--card-go-transform': 'translate(2px, -2px)',
            },
            '@media (max-width: 860px)': { gridTemplateColumns: '1fr' },
          })}
        >
          {plate}
          <div
            mix={css({
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              padding: '40px 40px 36px',
            })}
          >
            {meta}
            {title}
            {hook}
            {tags}
            <div
              mix={css({
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                marginTop: 'auto',
                paddingTop: '16px',
                color: 'var(--accent)',
                fontSize: '12px',
                letterSpacing: '0.09em',
              })}
            >
              <span>read the piece</span>
              {go(14)}
            </div>
          </div>
        </a>
      )
    }

    if (variant === 'row') {
      return (
        <a
          href={routes.writing.post.href({ slug: post.slug })}
          aria-label={ariaLabel}
          mix={css({
            display: 'grid',
            gridTemplateColumns: '208px minmax(0, 1fr) auto',
            gap: '28px',
            alignItems: 'start',
            padding: '26px 0',
            borderTop: '1px solid var(--rule)',
            '&:hover': {
              '--card-plate-border-color': 'var(--accent)',
              '--card-title-color': 'var(--accent)',
              '--card-go-transform': 'translate(2px, -2px)',
            },
            '@media (max-width: 720px)': {
              gridTemplateColumns: '92px minmax(0, 1fr)',
              gap: '16px',
            },
          })}
        >
          {plate}
          <div
            mix={css({ display: 'flex', flexDirection: 'column', gap: '11px', paddingTop: '4px' })}
          >
            {meta}
            {title}
            {hook}
          </div>
          <div
            class="card-read"
            mix={css({
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '8px',
              color: 'var(--accent)',
              fontSize: '11.5px',
              letterSpacing: '0.09em',
              '@media (max-width: 720px)': { display: 'none' },
            })}
          >
            <span>read</span>
            {go(13)}
          </div>
        </a>
      )
    }

    return (
      <a
        href={routes.writing.post.href({ slug: post.slug })}
        aria-label={ariaLabel}
        mix={css({
          display: 'grid',
          gridTemplateColumns: '92px minmax(0, 1fr)',
          gap: '16px',
          alignItems: 'start',
          padding: '18px 0',
          borderTop: '1px solid var(--rule)',
          '&:hover': { '--card-title-color': 'var(--accent)' },
        })}
      >
        {plate}
        <div mix={css({ display: 'flex', flexDirection: 'column', gap: '8px' })}>
          {meta}
          {title}
          {hook}
        </div>
      </a>
    )
  }
}
