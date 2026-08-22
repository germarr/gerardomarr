import { css, type Handle } from 'remix/ui'

import type { Project } from '../data/projects.ts'
import { areaPath, barsPath, cellsPath, lastPoint, linePath } from '../utils/thumbnails.ts'

const PAD = 28

export function Thumbnail(handle: Handle<{ project: Project }>) {
  return () => {
    let { project } = handle.props

    return (
      <div
        mix={css({
          position: 'relative',
          aspectRatio: '16 / 10',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--paper)',
        })}
      >
        {renderMotif(project)}
        <span
          mix={css({
            position: 'absolute',
            top: '12px',
            left: '14px',
            fontSize: '9.5px',
            letterSpacing: '0.16em',
            color: 'var(--ink-3)',
          })}
        >
          {project.kindLabel}
        </span>
      </div>
    )
  }
}

function svgProps() {
  return {
    viewBox: '0 0 320 200',
    width: '100%',
    height: '100%',
    'aria-hidden': 'true' as const,
  }
}

function renderMotif(project: Project) {
  if (project.kind === 'pitch') {
    return (
      <svg {...svgProps()} mix={css({ display: 'block' })}>
        <rect x="28" y="26" width="264" height="148" fill="none" stroke="var(--rule-2)" />
        <path d="M160 26 L160 174" stroke="var(--rule-2)" />
        <circle cx="160" cy="100" r="28" fill="none" stroke="var(--rule-2)" />
        <rect x="28" y="64" width="30" height="72" fill="none" stroke="var(--rule-2)" />
        <rect x="262" y="64" width="30" height="72" fill="none" stroke="var(--rule-2)" />
        <path
          d="M52 148 L96 112 L138 132 L176 88 L214 104 L262 68"
          fill="none"
          stroke="var(--accent)"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
        <g fill="var(--accent)">
          <circle cx="52" cy="148" r="3.2" />
          <circle cx="96" cy="112" r="3.2" />
          <circle cx="138" cy="132" r="3.2" />
          <circle cx="176" cy="88" r="3.2" />
          <circle cx="214" cy="104" r="3.2" />
          <circle cx="262" cy="68" r="4.6" />
        </g>
      </svg>
    )
  }

  if (project.kind === 'bars') {
    return (
      <svg {...svgProps()} mix={css({ display: 'block' })}>
        <path d="M28 172 L292 172" stroke="var(--rule-2)" />
        <path d="M28 100 L292 100" stroke="var(--rule-2)" stroke-dasharray="2 5" />
        <path d={barsPath(project.series, PAD, 6)} fill="var(--accent)" opacity="0.85" />
      </svg>
    )
  }

  if (project.kind === 'line') {
    let end = lastPoint(project.series, PAD)
    return (
      <svg {...svgProps()} mix={css({ display: 'block' })}>
        <path d="M28 172 L292 172" stroke="var(--rule-2)" />
        <path
          d="M28 128 L292 128 M28 84 L292 84 M28 40 L292 40"
          stroke="var(--rule-2)"
          stroke-dasharray="2 5"
        />
        <path d={areaPath(project.series, PAD)} fill="var(--accent)" opacity="0.14" />
        <path
          d={linePath(project.series, PAD)}
          fill="none"
          stroke="var(--accent)"
          stroke-width="1.9"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <circle cx={end.x} cy={end.y} r="4.6" fill="var(--accent)" />
      </svg>
    )
  }

  return (
    <svg {...svgProps()} mix={css({ display: 'block' })}>
      <path d={cellsPath(8, 5, PAD, null)} fill="none" stroke="var(--rule-2)" />
      <path d={cellsPath(8, 5, PAD, project.series)} fill="var(--accent)" opacity="0.85" />
    </svg>
  )
}
