import { css, type Handle } from 'remix/ui'

import type { Project } from '../data/projects.ts'
import { ArrowOut } from './icons.tsx'
import { CARD_TRANSITION } from './theme.ts'
import { Thumbnail } from './thumbnail.tsx'

/** `index` is the 2-up projects grid; `home` is the 3-up home grid. */
export type ProjectCardVariant = 'index' | 'home'

/**
 * Lifted from the rendered cards in design/Projects.dc.html (index) and
 * design/Main.dc.html (home) -- design/ProjectCard.dc.html's ANATOMY table
 * gives a single prose "11px" for host and doesn't call out the body gap,
 * the tag row's margin-top, or the home variant's bare (no letter-spacing)
 * name, all of which the two live pages render differently by variant.
 */
const SIZES = {
  index: {
    padding: '22px 22px 24px',
    gap: '12px',
    name: '18px',
    nameLetterSpacing: '-0.012em' as string | undefined,
    host: '11px',
    blurb: '13px',
    blurbLine: 1.68,
    tag: '4px 8px',
    tagRowMarginTop: '6px',
    arrow: 14,
  },
  home: {
    padding: '18px 18px 20px',
    gap: '10px',
    name: '15px',
    nameLetterSpacing: undefined as string | undefined,
    host: '10.5px',
    blurb: '12.5px',
    blurbLine: 1.6,
    tag: '3px 7px',
    tagRowMarginTop: '4px',
    arrow: 13,
  },
} as const

export function ProjectCard(handle: Handle<{ project: Project; variant?: ProjectCardVariant }>) {
  return () => {
    let { project, variant = 'index' } = handle.props
    let size = SIZES[variant]

    return (
      <a
        href={project.url}
        mix={css({
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--rule)',
          background: 'var(--paper-2)',
          transition: CARD_TRANSITION,
          '&:hover': { borderColor: 'var(--accent)', transform: 'translateY(-3px)' },
          '&:hover .card-name': { color: 'var(--accent)' },
          '&:hover .card-go': { transform: 'translate(2px, -2px)' },
        })}
      >
        <Thumbnail project={project} />
        <div
          mix={css({
            display: 'flex',
            flexDirection: 'column',
            gap: size.gap,
            padding: size.padding,
          })}
        >
          <div
            mix={css({
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '12px',
            })}
          >
            <span
              class="card-name"
              mix={css({
                fontSize: size.name,
                fontWeight: 600,
                letterSpacing: size.nameLetterSpacing,
                color: 'var(--ink)',
                transition: 'color 160ms ease',
              })}
            >
              {project.name}
            </span>
            <span
              class="card-go"
              aria-hidden="true"
              mix={css({
                display: 'flex',
                color: 'var(--accent)',
                transition: 'transform 160ms ease',
              })}
            >
              <ArrowOut size={size.arrow} />
            </span>
          </div>
          <span mix={css({ fontSize: size.host, letterSpacing: '0.04em', color: 'var(--ink-3)' })}>
            {project.host}
          </span>
          <p
            mix={css({
              margin: 0,
              fontSize: size.blurb,
              lineHeight: size.blurbLine,
              color: 'var(--ink-2)',
              textWrap: 'pretty',
            })}
          >
            {project.blurb}
          </p>
          <div
            mix={css({
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px',
              marginTop: size.tagRowMarginTop,
            })}
          >
            {project.tech.map((tag) => (
              <span
                key={tag}
                mix={css({
                  padding: size.tag,
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
        </div>
      </a>
    )
  }
}
