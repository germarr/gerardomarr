import type { Handle, RemixNode } from 'remix/ui'
import { css } from 'remix/ui'

import { Document } from '../actions/document.tsx'
import { MobileMenu } from '../actions/public/mobile-menu.tsx'
import { ThemeToggle } from '../actions/public/theme-toggle.tsx'
import { routes } from '../routes.ts'
import { ArrowBack } from './icons.tsx'

export type Section = 'index' | 'projects' | 'writing'

export interface ShellProps {
  section: Section
  title?: string
  description?: string
  /** Article pages swap the primary nav for a single back link. */
  backTo?: { href: string; label: string }
  children?: RemixNode
}

interface NavItem {
  section: Section
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { section: 'index', label: 'index', href: routes.home.href() },
  { section: 'projects', label: 'projects', href: routes.projects.index.href() },
  { section: 'writing', label: 'writing', href: routes.writing.index.href() },
]

export function Shell(handle: Handle<ShellProps>) {
  return () => {
    let { section, title, description, backTo, children } = handle.props

    return (
      <Document title={title} description={description}>
        <a
          href="#main"
          mix={css({
            position: 'absolute',
            left: '-9999px',
            top: 0,
            zIndex: 30,
            padding: '10px 16px',
            background: 'var(--paper-2)',
            border: '1px solid var(--accent)',
            color: 'var(--ink)',
            fontSize: '12px',
            letterSpacing: '0.08em',
            '&:focus': { left: '8px', top: '8px' },
          })}
        >
          Skip to content
        </a>

        <header mix={headerStyle}>
          {backTo ? (
            <>
              <BackLink href={backTo.href} label={backTo.label} />
              <Wordmark />
              <ThemeToggle />
            </>
          ) : (
            <>
              <Wordmark />
              <nav aria-label="Primary" mix={navStyle}>
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.section} item={item} active={item.section === section} />
                ))}
                <ThemeToggle />
              </nav>
              <MobileMenu section={section} />
            </>
          )}
        </header>
        <main id="main">{children}</main>
        <Footer />
      </Document>
    )
  }
}

function Wordmark() {
  return () => (
    <a href={routes.home.href()} mix={wordmarkStyle}>
      <span mix={css({ color: 'var(--accent)', fontSize: '13px', fontWeight: 600 })}>~/</span>
      <span mix={css({ fontSize: '13px', fontWeight: 500, letterSpacing: '0.01em' })}>
        gerardo-martinez
      </span>
      <span aria-hidden="true" mix={caretStyle} />
    </a>
  )
}

function NavLink(handle: Handle<{ item: NavItem; active: boolean }>) {
  return () => {
    let { item, active } = handle.props

    return (
      <a
        href={item.href}
        aria-current={active ? 'page' : undefined}
        mix={css({
          display: 'flex',
          alignItems: active ? 'center' : undefined,
          flexDirection: active ? undefined : 'column',
          gap: active ? '8px' : '3px',
          color: active ? 'var(--ink)' : 'var(--ink-2)',
          fontSize: '12px',
          letterSpacing: '0.09em',
          '&:hover': { color: 'var(--ink)' },
          '&:hover .nav-underline': active ? undefined : { transform: 'scaleX(1)' },
        })}
      >
        {active ? (
          <span mix={css({ width: '6px', height: '6px', background: 'var(--accent)' })} />
        ) : null}
        <span>{item.label}</span>
        {active ? null : (
          <span
            class="nav-underline"
            mix={css({
              height: '1px',
              background: 'var(--accent)',
              transform: 'scaleX(0)',
              transformOrigin: 'left',
              transition: 'transform 180ms ease',
            })}
          />
        )}
      </a>
    )
  }
}

function BackLink(handle: Handle<{ href: string; label: string }>) {
  return () => (
    <a
      href={handle.props.href}
      mix={css({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: 'var(--ink-2)',
        fontSize: '12px',
        letterSpacing: '0.09em',
        '&:hover': { color: 'var(--ink)' },
      })}
    >
      <span aria-hidden="true" mix={css({ display: 'flex', color: 'var(--accent)' })}>
        <ArrowBack size={13} />
      </span>
      <span>{handle.props.label}</span>
    </a>
  )
}

function Footer() {
  return () => (
    <footer mix={footerStyle}>
      <div mix={footerBarStyle}>
        <span>gerardomarr.com</span>
        <span>© 2026 Gerardo Martinez</span>
      </div>
    </footer>
  )
}

const headerStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '32px',
  padding: '20px 48px',
  borderBottom: '1px solid var(--rule)',
  background: 'var(--paper)',
  position: 'relative',
  '@media (max-width: 720px)': { padding: '12px 20px' },
})

const navStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '28px',
  '@media (max-width: 720px)': { display: 'none' },
})

const wordmarkStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  color: 'var(--ink)',
})

const caretStyle = css({
  display: 'inline-block',
  width: '7px',
  height: '15px',
  background: 'var(--accent)',
  animation: 'caret 1.15s steps(1, end) infinite',
  '@keyframes caret': {
    '0%, 50%': { opacity: 1 },
    '50.01%, 100%': { opacity: 0 },
  },
})

const footerStyle = css({
  padding: '0 48px 56px',
  '@media (max-width: 720px)': { padding: '0 20px 40px' },
})

const footerBarStyle = css({
  maxWidth: '1080px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '24px',
  paddingTop: '22px',
  borderTop: '1px solid var(--rule)',
  fontSize: '10.5px',
  letterSpacing: '0.08em',
  color: 'var(--ink-3)',
})
