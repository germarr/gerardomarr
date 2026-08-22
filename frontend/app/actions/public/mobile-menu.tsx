import { css, type Handle } from 'remix/ui'

import type { Section } from '../../ui/shell.tsx'

export function MobileMenu(_handle: Handle<{ section: Section }>) {
  return () => <span mix={css({ display: 'none' })} data-mobile-menu-placeholder="" />
}
