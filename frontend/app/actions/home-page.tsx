import { css } from 'remix/ui'

import { ABOUT } from '../data/about.ts'
import { allPosts } from '../data/posts.ts'
import { featuredProjects } from '../data/projects.ts'
import { routes } from '../routes.ts'
import { ArrowOut, ArrowRight, GitHub, Instagram, LinkedIn } from '../ui/icons.tsx'
import { centeredColumnBase, promptLineStyle } from '../ui/page-layout.ts'
import { PostCard } from '../ui/post-card.tsx'
import { ProjectCard } from '../ui/project-card.tsx'
import { SectionRule } from '../ui/section-rule.tsx'
import { Shell } from '../ui/shell.tsx'

/**
 * Page chrome, not ABOUT copy: the GitHub/LinkedIn/Instagram icon plus the
 * `<platform>.com/[handle]`-style placeholder shown on the ELSEWHERE cards
 * in design/Main.dc.html. `href` is the only piece that comes from ABOUT --
 * the real, owner-supplied `[YOUR ... URL]` placeholder.
 */
const SOCIALS = [
  { name: 'GitHub', href: ABOUT.social.github, handle: 'github.com/[handle]', Icon: GitHub },
  {
    name: 'LinkedIn',
    href: ABOUT.social.linkedin,
    handle: 'linkedin.com/in/[handle]',
    Icon: LinkedIn,
  },
  {
    name: 'Instagram',
    href: ABOUT.social.instagram,
    handle: 'instagram.com/[handle]',
    Icon: Instagram,
  },
] as const

export function HomePage() {
  return () => (
    <Shell section="index" title={ABOUT.name} description={ABOUT.intro}>
      <Hero />
      <AboutSection />
      <ProjectsSection />
      <WritingSection />
      <ElsewhereSection />
    </Shell>
  )
}

function Hero() {
  let [firstName, ...restOfName] = ABOUT.name.split(' ')
  let lastName = restOfName.join(' ')

  return () => (
    <section aria-label="Introduction" mix={heroSectionStyle}>
      <div mix={heroInnerStyle}>
        <span mix={promptLineStyle}>$ whoami</span>
        <h1 mix={heroNameStyle}>
          {firstName}
          <br />
          {lastName}
        </h1>
        <div mix={tagRowStyle}>
          {ABOUT.tagline.map((tag) => (
            <span key={tag} mix={tagChipStyle}>
              {tag}
            </span>
          ))}
        </div>
        <p mix={introStyle}>{ABOUT.intro}</p>
        <div mix={socialRowStyle}>
          {SOCIALS.map((social) => (
            <a key={social.name} href={social.href} mix={socialLinkStyle}>
              <span aria-hidden="true" mix={iconSlotStyle}>
                <social.Icon />
              </span>
              <span>{social.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return () => (
    <section aria-label="About" mix={aboutSectionStyle}>
      <div mix={aboutInnerStyle}>
        <SectionRule number="01" label="ABOUT" heading />
        <div mix={aboutGridStyle}>
          <p mix={aboutLeadStyle}>{ABOUT.lead}</p>
          <div mix={aboutBodyColStyle}>
            {ABOUT.body.map((paragraph) => (
              <p key={paragraph} mix={aboutBodyParagraphStyle}>
                {paragraph}
              </p>
            ))}
            <div mix={kickerRowStyle}>
              <span mix={kickerMarkStyle}>&gt;</span>
              <p mix={kickerTextStyle}>{ABOUT.kicker}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProjectsSection() {
  let projects = featuredProjects()

  return () => (
    <section aria-label="Selected projects" mix={projectsSectionStyle}>
      <div mix={projectsInnerStyle}>
        <SectionRule number="02" label="SELECTED PROJECTS" heading />
        <div mix={projectsGridStyle}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} variant="home" headingLevel={3} />
          ))}
        </div>
        <a href={routes.projects.index.href()} mix={seeAllLinkStyle}>
          <span>See all projects</span>
          <span aria-hidden="true" mix={accentIconSlotStyle}>
            <ArrowRight size={13} />
          </span>
        </a>
      </div>
    </section>
  )
}

function WritingSection() {
  let posts = allPosts().slice(0, 2)

  return () => (
    <section aria-label="Recent writing" mix={writingSectionStyle}>
      <div mix={writingInnerStyle}>
        <SectionRule number="03" label="RECENT WRITING" heading />
        <div mix={writingListStyle}>
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} index={index} variant="row" headingLevel={3} />
          ))}
        </div>
        <a href={routes.writing.index.href()} mix={seeAllLinkStyle}>
          <span>All writing</span>
          <span aria-hidden="true" mix={accentIconSlotStyle}>
            <ArrowRight size={13} />
          </span>
        </a>
      </div>
    </section>
  )
}

function ElsewhereSection() {
  return () => (
    <section aria-label="Elsewhere" mix={elsewhereSectionStyle}>
      <div mix={elsewhereInnerStyle}>
        <SectionRule number="04" label="ELSEWHERE" heading />
        <div mix={elsewhereGridStyle}>
          {SOCIALS.map((social) => (
            <a key={social.name} href={social.href} mix={socialCardStyle}>
              <span aria-hidden="true" mix={inkIconSlotStyle}>
                <social.Icon size={20} />
              </span>
              <div mix={socialCardTextStyle}>
                <span class="social-name" mix={socialCardNameStyle}>
                  {social.name}
                </span>
                <span mix={socialCardHandleStyle}>{social.handle}</span>
              </div>
              <span aria-hidden="true" mix={accentIconSlotStyle}>
                <ArrowOut size={13} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── shared icon slots ─────────────────────────────────────────────────

const iconSlotStyle = css({ display: 'flex' })
const accentIconSlotStyle = css({ display: 'flex', color: 'var(--accent)' })
const inkIconSlotStyle = css({ display: 'flex', color: 'var(--ink)' })

/**
 * Both "See all projects" and "All writing" reuse design/Main.dc.html's
 * `.textlink` treatment: hover only swaps the underline to accent, the
 * text itself stays --ink.
 */
const seeAllLinkStyle = css({
  alignSelf: 'flex-start',
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  color: 'var(--ink)',
  fontSize: '12.5px',
  letterSpacing: '0.06em',
  paddingBottom: '2px',
  borderBottom: '1px solid var(--rule-2)',
  transition: 'border-color 160ms ease',
  '&:hover': { borderBottomColor: 'var(--accent)' },
})

// ─── hero ───────────────────────────────────────────────────────────────
// Breakpoints (720/860/980) aren't in design/Main.dc.html itself -- that
// file is a fixed-width reference. They're picked to match where
// design/HomeMobile.dc.html's 390px layout needs the collapsed form, per
// the task text's own explicit numbers.

const heroSectionStyle = css({
  padding: '96px 48px 80px',
  '@media (max-width: 720px)': { padding: '44px 20px 40px' },
})

const heroInnerStyle = css({ ...centeredColumnBase, gap: '34px' })

const heroNameStyle = css({
  margin: 0,
  fontSize: '76px',
  lineHeight: 0.98,
  letterSpacing: '-0.025em',
  fontWeight: 600,
  color: 'var(--ink)',
  '@media (max-width: 720px)': { fontSize: '42px', lineHeight: 1.02 },
})

const tagRowStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
})

const tagChipStyle = css({
  padding: '6px 11px',
  border: '1px solid var(--rule-2)',
  fontSize: '11.5px',
  letterSpacing: '0.05em',
  color: 'var(--ink-2)',
})

const introStyle = css({
  margin: 0,
  maxWidth: '68ch',
  fontSize: '15px',
  lineHeight: 1.75,
  color: 'var(--ink-2)',
  textWrap: 'pretty',
})

const socialRowStyle = css({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '22px',
  marginTop: '6px',
})

const socialLinkStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--ink-2)',
  fontSize: '12px',
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--rule-2)',
  transition: 'border-color 160ms ease',
  '&:hover': { borderBottomColor: 'var(--accent)' },
})

// ─── 01 about ─────────────────────────────────────────────────────────

const aboutSectionStyle = css({ padding: '24px 48px 88px' })

const aboutInnerStyle = css({ ...centeredColumnBase, gap: '36px' })

const aboutGridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.35fr)',
  gap: '56px',
  alignItems: 'start',
  '@media (max-width: 860px)': { gridTemplateColumns: '1fr' },
})

const aboutLeadStyle = css({
  margin: 0,
  fontSize: '23px',
  lineHeight: 1.38,
  letterSpacing: '-0.012em',
  color: 'var(--ink)',
  textWrap: 'pretty',
})

const aboutBodyColStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
})

const aboutBodyParagraphStyle = css({
  margin: 0,
  fontSize: '14.5px',
  lineHeight: 1.78,
  color: 'var(--ink-2)',
  textWrap: 'pretty',
})

const kickerRowStyle = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: '12px',
  marginTop: '8px',
})

const kickerMarkStyle = css({
  color: 'var(--accent)',
  fontSize: '17px',
  fontWeight: 600,
})

const kickerTextStyle = css({
  margin: 0,
  fontSize: '17px',
  lineHeight: 1.5,
  color: 'var(--ink)',
  fontWeight: 500,
})

// ─── 02 selected projects ────────────────────────────────────────────

const projectsSectionStyle = css({ padding: '0 48px 88px' })

const projectsInnerStyle = css({ ...centeredColumnBase, gap: '32px' })

const projectsGridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '20px',
  '@media (max-width: 980px)': { gridTemplateColumns: '1fr' },
})

// ─── 03 recent writing ────────────────────────────────────────────────

const writingSectionStyle = css({ padding: '0 48px 88px' })

const writingInnerStyle = css({ ...centeredColumnBase, gap: '28px' })

/**
 * `PostCard`'s `row` variant only draws its own top rule, so the list that
 * closes design/Main.dc.html's writing section owns the bottom rule that
 * terminates it (see the last `.post` there, which carries both
 * border-top and border-bottom).
 */
const writingListStyle = css({
  display: 'flex',
  flexDirection: 'column',
  borderBottom: '1px solid var(--rule)',
})

// ─── 04 elsewhere ─────────────────────────────────────────────────────

const elsewhereSectionStyle = css({ padding: '0 48px 64px' })

const elsewhereInnerStyle = css({ ...centeredColumnBase, gap: '32px' })

const elsewhereGridStyle = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '20px',
  '@media (max-width: 860px)': { gridTemplateColumns: '1fr' },
})

const socialCardStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '20px',
  border: '1px solid var(--rule)',
  background: 'var(--paper-2)',
  transition: 'border-color 160ms ease',
  // The name colour travels down as an inherited custom property. A
  // '&:hover .social-name' rule here would sit in this component's layer and
  // silently lose to the name span's own later layer -- see
  // app/cascade-layers.test.ts.
  '&:hover': { borderColor: 'var(--accent)', '--social-name-color': 'var(--accent)' },
})

const socialCardTextStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flexGrow: 1,
})

const socialCardNameStyle = css({
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--social-name-color, var(--ink))',
  transition: 'color 160ms ease',
})

const socialCardHandleStyle = css({
  fontSize: '10.5px',
  letterSpacing: '0.04em',
  color: 'var(--ink-3)',
})
