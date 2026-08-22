export type ProjectKind = 'pitch' | 'bars' | 'line' | 'grid'

export interface Project {
  id: string
  name: string
  /** Bare domain, no protocol. */
  host: string
  url: string
  kind: ProjectKind
  /** A short all-caps label shown top-left inside the thumbnail. */
  kindLabel: string
  blurb: string
  /** Drives both the tags on the card and the stack filter. */
  tech: string[]
  /**
   * 'bars' and 'line': the plotted values.
   * 'grid': indices of the filled cells.
   * 'pitch': unused, that motif is fixed geometry.
   */
  series: number[]
  /** The three shown on the home page. */
  featured: boolean
}

// ─────────────────────────────────────────────────────────────────────────
// Add a project by adding an object here. The stack filter rebuilds itself
// from `tech`, and the home page picks up anything marked `featured`.
// ─────────────────────────────────────────────────────────────────────────
export const PROJECTS: Project[] = [
  {
    id: 'lacancha',
    name: 'La Cancha',
    host: 'lacancha.gerardomarr.com',
    url: 'https://lacancha.gerardomarr.com',
    kind: 'pitch',
    kindLabel: 'FOOTBALL DATA',
    blurb:
      'An Astro front end on Azure Containers over a Postgres and PocketBase back end, fed live by Football-API and shipped through GitHub Actions.',
    tech: ['Astro', 'Postgres', 'PocketBase', 'Azure', 'Football-API', 'GitHub Actions'],
    series: [],
    featured: true,
  },
  {
    id: 'queuescope',
    // The domain is not a mistake: Universal Orlando is the movie-themed park,
    // so "de pelicula" is the joke. Confirmed by the owner; please stop
    // "fixing" it.
    name: 'Queue Scope',
    host: 'depelicula.gerardomarr.com',
    url: 'https://depelicula.gerardomarr.com',
    kind: 'bars',
    kindLabel: 'QUEUE TELEMETRY',
    blurb:
      'A live wait-time dashboard for Universal Orlando. A cron collector polls themeparks.wiki every minute into SQLite; a FastAPI app then charts how ride queues move across the day, week, and month — with weather overlaid on the trend.',
    tech: ['Python', 'FastAPI', 'SQLite', 'pandas', 'Chart.js'],
    series: [34, 52, 71, 96, 88, 63, 47, 58, 82, 74, 45, 30],
    featured: true,
  },
  {
    id: 'trending',
    name: 'Trending',
    host: 'trending.gerardomarr.com',
    url: 'https://trending.gerardomarr.com',
    kind: 'line',
    kindLabel: 'TREND SIGNAL',
    blurb:
      'What YouTube is pushing, tracked over time. A FastAPI service on an Azure VM collects and serves the data behind a static front end deployed to Azure Static Web Apps.',
    tech: ['Python', 'FastAPI', 'Azure', 'GitHub Actions'],
    series: [12, 18, 15, 27, 34, 30, 46, 58, 51, 72, 88, 96],
    featured: true,
  },
  {
    id: 'movies',
    name: 'Movies MX',
    host: 'movies.gerardomarr.com',
    url: 'https://movies.gerardomarr.com',
    kind: 'grid',
    kindLabel: 'SCREENINGS',
    blurb:
      'A dashboard tracking which movies are being screened in Mexico.',
    tech: ['Python', 'FastAPI', 'SQLite', 'pandas', 'Chart.js'],
    series: [1, 2, 5, 8, 9, 11, 14, 17, 18, 19, 22, 25, 26, 29, 33, 34, 37],
    featured: false,
  },
]

/** URL-safe form of a tag: `Chart.js` -> `chart-js`. */
export function slugifyTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function featuredProjects(): Project[] {
  return PROJECTS.filter((project) => project.featured)
}

/** Every tag across every project, most widely used first, then alphabetical. */
export function stackTags(): string[] {
  let counts = new Map<string, number>()
  for (let project of PROJECTS) {
    for (let tag of project.tech) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b))
}

export function projectsByStack(tagSlug: string): Project[] {
  return PROJECTS.filter((project) => project.tech.some((tag) => slugifyTag(tag) === tagSlug))
}
