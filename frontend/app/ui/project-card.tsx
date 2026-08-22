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
 * gives a single prose "11px" for host and doesn't call out the body gap
 * or the home variant's bare (no letter-spacing) name, both of which the
 * two live pages render differently by variant.
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
    arrow: 13,
  },
} as const

export interface ProjectCardProps {
  project: Project
  variant?: ProjectCardVariant
  /**
   * Render the project name as a real heading at this depth instead of a
   * decorative `<span>`. Omit to keep the `<span>` -- e.g. on the home
   * page's ELSEWHERE cards, which aren't ProjectCard at all, or any other
   * caller that hasn't been given a slot in the page's heading outline.
   */
  headingLevel?: 2 | 3
}

export function ProjectCard(handle: Handle<ProjectCardProps>) {
  return () => {
    let { project, variant = 'index', headingLevel } = handle.props
    let size = SIZES[variant]
    let NameTag: 'h2' | 'h3' | 'span' =
      headingLevel === 2 ? 'h2' : headingLevel === 3 ? 'h3' : 'span'

    return (
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.name}, ${project.host} (opens in a new tab)`}
        mix={css({
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--rule)',
          background: 'var(--paper-2)',
          transition: CARD_TRANSITION,
          '&:hover': {
            borderColor: 'var(--accent)',
            transform: 'translateY(-3px)',
            '--card-name-color': 'var(--accent)',
            '--card-go-transform': 'translate(2px, -2px)',
          },
        })}
      >
        <Thumbnail project={project} />
        <div
          mix={css({
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
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
            <NameTag
              class="card-name"
              mix={css({
                margin: 0,
                fontSize: size.name,
                fontWeight: 600,
                letterSpacing: size.nameLetterSpacing,
                color: 'var(--card-name-color, var(--ink))',
                transition: 'color 160ms ease',
              })}
            >
              {project.name}
            </NameTag>
            <span
              class="card-go"
              aria-hidden="true"
              mix={css({
                display: 'flex',
                color: 'var(--accent)',
                transform: 'var(--card-go-transform, translate(0, 0))',
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
              marginTop: 'auto',
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
