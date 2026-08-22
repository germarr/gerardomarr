import { clientEntry, css, on, type Handle } from 'remix/ui'

export type Theme = 'light' | 'dark'

/**
 * The server always renders assuming light (see document.tsx's NO_FLASH
 * script, which corrects `data-theme` before first paint but leaves the
 * server-rendered markup itself untouched). So "next theme" here really
 * means "the theme this button currently offers to switch to" -- anything
 * that isn't literally 'dark' flips to 'dark'.
 */
export function nextTheme(current: string | null): Theme {
  return current === 'dark' ? 'light' : 'dark'
}

function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Some privacy modes throw on localStorage access. The toggle should
    // still work for the current page view even if it can't persist.
  }
}

export const ThemeToggle = clientEntry(
  import.meta.url,
  function ThemeToggle(handle: Handle) {
    // The server always renders <html data-theme="light">, so assume
    // 'light' until hydration proves otherwise. The button's label is the
    // *other* theme -- the one clicking it will switch to.
    let current: Theme = 'light'

    // The inline no-flash script in document.tsx already set the real
    // `data-theme` on <html> before this component ran, so read it back
    // once mounted and correct our assumption if a returning visitor is
    // actually in dark mode.
    handle.queueTask(() => {
      let actual: Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
      if (actual !== current) {
        current = actual
        handle.update()
      }
    })

    return () => {
      let label = nextTheme(current)
      return (
        <button
          type="button"
          aria-label={`Switch to ${label} theme`}
          mix={[
            toggleStyle,
            on('click', () => {
              let next = nextTheme(current)
              document.documentElement.setAttribute('data-theme', next)
              writeStoredTheme(next)
              current = next
              handle.update()
            }),
          ]}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
          </svg>
          <span>{label}</span>
        </button>
      )
    }
  },
)

const toggleStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  padding: '7px 11px',
  background: 'transparent',
  border: '1px solid var(--rule-2)',
  color: 'var(--ink-2)',
  fontFamily: 'inherit',
  fontSize: '11px',
  letterSpacing: '0.09em',
  cursor: 'pointer',
  transition: 'border-color 160ms ease, color 160ms ease',
  '&:hover': { borderColor: 'var(--accent)', color: 'var(--accent)' },
})
