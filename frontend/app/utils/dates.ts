const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

/** `2026-08-14` -> `AUG 14 2026`. No Intl, so prerender output is stable. */
export function formatPostDate(iso: string): string {
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) throw new Error(`Expected a YYYY-MM-DD date, got "${iso}"`)

  let [, year, month, day] = match
  let name = MONTHS[Number.parseInt(month!, 10) - 1]
  if (!name) throw new Error(`Expected a YYYY-MM-DD date, got "${iso}"`)

  return `${name} ${Number.parseInt(day!, 10)} ${year}`
}
