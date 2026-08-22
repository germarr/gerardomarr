import { css, type Handle } from 'remix/ui'

export function ThemeToggle(_handle: Handle) {
  return () => <span mix={css({ display: 'none' })} data-theme-toggle-placeholder="" />
}
