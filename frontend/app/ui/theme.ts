export const FONT_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
export const FONT_SANS = "'IBM Plex Sans', system-ui, sans-serif"

export const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap'

/**
 * Applied once, to <html>, so `data-theme` on the same element flips the
 * whole palette. Lifted from the helmet block in design/*.dc.html.
 */
export const themeTokens: Record<string, unknown> = {
  '--paper': 'oklch(0.973 0.006 85)',
  '--paper-2': 'oklch(0.958 0.008 82)',
  '--ink': 'oklch(0.245 0.012 62)',
  '--ink-2': 'oklch(0.455 0.010 68)',
  '--ink-3': 'oklch(0.615 0.008 72)',
  '--rule': 'oklch(0.885 0.008 80)',
  '--rule-2': 'oklch(0.815 0.010 78)',
  '--accent': 'oklch(0.575 0.155 42)',
  '--accent-wash': 'oklch(0.575 0.155 42 / 0.10)',
  '--on-accent': 'oklch(0.985 0.004 85)',
  colorScheme: 'light',

  '&[data-theme="dark"]': {
    '--paper': 'oklch(0.178 0.008 70)',
    '--paper-2': 'oklch(0.224 0.009 70)',
    '--ink': 'oklch(0.925 0.006 85)',
    '--ink-2': 'oklch(0.735 0.008 78)',
    '--ink-3': 'oklch(0.575 0.008 74)',
    '--rule': 'oklch(0.302 0.010 72)',
    '--rule-2': 'oklch(0.382 0.012 72)',
    '--accent': 'oklch(0.740 0.145 55)',
    '--accent-wash': 'oklch(0.740 0.145 55 / 0.14)',
    '--on-accent': 'oklch(0.178 0.008 70)',
    colorScheme: 'dark',
  },
}

/** Base page styles, applied to <body>. */
export const pageBase = {
  margin: 0,
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontFamily: FONT_MONO,
  fontSize: '14px',
  lineHeight: 1.5,
  WebkitFontSmoothing: 'antialiased',
  '& *, & *::before, & *::after': { boxSizing: 'border-box' },
  '& a': { color: 'var(--accent)', textDecoration: 'none' },
}

/** Shared card/link hover recipe used by both card components. */
export const CARD_TRANSITION = 'border-color 160ms ease, transform 160ms ease'
