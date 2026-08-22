import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import { routes } from '../../routes.ts'
import type { Section } from '../../ui/shell.tsx'
import { ThemeToggle } from './theme-toggle.tsx'

interface MobileMenuProps extends SerializableProps {
  section: Section
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

export const MobileMenu = clientEntry(
  import.meta.url,
  function MobileMenu(handle: Handle<MobileMenuProps>) {
    let open = false

    return () => {
      let { section } = handle.props

      return (
        <>
          <div mix={wrapperStyle}>
            <ThemeToggle />
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              mix={[
                buttonStyle,
                on('click', () => {
                  open = !open
                  handle.update()
                }),
              ]}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d={open ? 'M5 5 L19 19' : 'M4 8h16'}></path>
                <path d={open ? 'M19 5 L5 19' : 'M4 16h16'}></path>
              </svg>
            </button>
          </div>
          {open ? (
            <nav aria-label="Primary" mix={panelStyle}>
              {NAV_ITEMS.map((item) => (
                <MobileNavLink key={item.section} item={item} active={item.section === section} />
              ))}
            </nav>
          ) : null}
        </>
      )
    }
  },
)

function MobileNavLink(handle: Handle<{ item: NavItem; active: boolean }>) {
  return () => {
    let { item, active } = handle.props

    return (
      <a
        href={item.href}
        aria-current={active ? 'page' : undefined}
        mix={css({
          display: 'flex',
          alignItems: 'center',
          gap: active ? '10px' : undefined,
          minHeight: '52px',
          padding: active ? '0 20px' : '0 36px',
          color: active ? 'var(--ink)' : 'var(--ink-2)',
          fontSize: '14px',
          letterSpacing: '0.08em',
          borderBottom: '1px solid var(--rule)',
        })}
      >
        {active ? (
          <span mix={css({ width: '6px', height: '6px', background: 'var(--accent)' })} />
        ) : null}
        <span>{item.label}</span>
      </a>
    )
  }
}

const wrapperStyle = css({
  display: 'none',
  alignItems: 'center',
  gap: '8px',
  '@media (max-width: 720px)': { display: 'flex' },
})

const buttonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '44px',
  height: '44px',
  background: 'transparent',
  border: '1px solid var(--rule-2)',
  color: 'var(--ink)',
  cursor: 'pointer',
  transition: 'border-color 160ms ease',
  '&:hover': { borderColor: 'var(--accent)' },
})

const panelStyle = css({
  display: 'flex',
  flexDirection: 'column',
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 20,
  background: 'var(--paper)',
  borderTop: '1px solid var(--rule)',
})
