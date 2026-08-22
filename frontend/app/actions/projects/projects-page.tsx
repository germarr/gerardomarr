import type { Handle } from 'remix/ui'
import { css } from 'remix/ui'

import type { Project } from '../../data/projects.ts'
import { slugifyTag, stackTags } from '../../data/projects.ts'
import { routes } from '../../routes.ts'
import { centeredColumnBase, promptLineStyle } from '../../ui/page-layout.ts'
import { ProjectCard } from '../../ui/project-card.tsx'
import { SectionRule } from '../../ui/section-rule.tsx'
import { Shell } from '../../ui/shell.tsx'

export interface ProjectsPageProps {
  projects: Project[]
  total: number
  activeTag: string | null
}

function pad2(n: number): string {
  return (n < 10 ? '0' : '') + n
}

export function ProjectsPage(handle: Handle<ProjectsPageProps>) {
  return () => {
    let { projects, total, activeTag } = handle.props
    let tags = stackTags()
    let countLabel = `${pad2(projects.length)} / ${pad2(total)}`

    return (
      <Shell
        section="projects"
        title="Projects"
        description="Things I built to answer a question I actually had."
      >
        <section aria-label="Projects" mix={headerSectionStyle}>
          <div mix={headerInnerStyle}>
            <span mix={promptLineStyle}>$ ls projects/</span>
            <h1 mix={titleStyle}>Projects</h1>
            <p mix={introStyle}>
              Things I built to answer a question I actually had. Most of them collect their own
              data, run on my own infrastructure, and are still running right now.
            </p>
          </div>
        </section>

        <section aria-label="Project list" mix={listSectionStyle}>
          <div mix={listInnerStyle}>
            <SectionRule label="FILTER BY STACK" trailing={countLabel} />

            {/*
              "FILTER BY STACK" labels this chip row, not a content section --
              it's a group of filter controls, not prose to navigate to by
              heading. So the row gets its own accessible name as a <nav>
              landmark (each chip really is a link to a distinct filtered
              URL) rather than promoting the label to an <h2>.
            */}
            <nav aria-label="Filter by stack" mix={chipRowStyle}>
              <FilterChip
                label="all"
                href={routes.projects.index.href()}
                active={activeTag === null}
              />
              {tags.map((tag) => {
                let slug = slugifyTag(tag)
                return (
                  <FilterChip
                    key={tag}
                    label={tag}
                    href={routes.projects.byStack.href({ tag: slug })}
                    active={activeTag === slug}
                  />
                )
              })}
            </nav>

            {projects.length > 0 ? (
              <div mix={gridStyle}>
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} variant="index" />
                ))}
              </div>
            ) : (
              <div mix={emptyStyle}>no projects match that filter yet</div>
            )}
          </div>
        </section>
      </Shell>
    )
  }
}

function FilterChip(handle: Handle<{ label: string; href: string; active: boolean }>) {
  return () => {
    let { label, href, active } = handle.props

    return (
      <a
        href={href}
        aria-current={active ? 'page' : undefined}
        mix={active ? chipActiveStyle : chipInactiveStyle}
      >
        {label}
      </a>
    )
  }
}

const headerSectionStyle = css({
  padding: '72px 48px 40px',
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

const listSectionStyle = css({
  padding: '0 48px 88px',
  '@media (max-width: 720px)': { padding: '0 20px 56px' },
})

const listInnerStyle = css({ ...centeredColumnBase, gap: '26px' })

const chipRowStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '7px',
})

const chipBaseStyle = {
  padding: '6px 11px',
  fontSize: '11px',
  letterSpacing: '0.06em',
  transition: 'border-color 140ms ease, color 140ms ease, background 140ms ease',
}

const chipActiveStyle = css({
  ...chipBaseStyle,
  background: 'var(--accent)',
  border: '1px solid var(--accent)',
  color: 'var(--on-accent)',
})

const chipInactiveStyle = css({
  ...chipBaseStyle,
  background: 'transparent',
  border: '1px solid var(--rule-2)',
  color: 'var(--ink-2)',
  '&:hover': { borderColor: 'var(--accent)' },
})

const gridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '24px',
  '@media (max-width: 860px)': { gridTemplateColumns: '1fr' },
})

const emptyStyle = css({
  padding: '56px 0',
  textAlign: 'center',
  color: 'var(--ink-3)',
  fontSize: '13px',
  letterSpacing: '0.06em',
})
