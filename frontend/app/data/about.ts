export interface About {
  name: string
  /** The chips under the name. */
  tagline: string[]
  intro: string
  /** The large opening line of the About section. */
  lead: string
  body: string[]
  /** The prompt-marked closing line. */
  kicker: string
  social: {
    github: string
    linkedin: string
    instagram: string
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Edit this to change everything the home page says about you.
// The display text under each social icon lives in `SOCIALS` in
// `app/actions/home-page.tsx` -- change a handle here and change it there.
// ─────────────────────────────────────────────────────────────────────────
export const ABOUT: About = {
  name: 'Gerardo Martinez',
  tagline: ['Applied Data', 'Marketing Science', 'Python', 'AI on the Edge'],
  intro:
    'Data Scientist with expertise in Marketing Mix Models, campaign optimization, and full-funnel marketing analytics. Outside work, I chase alternative datasets like football, theme parks, prediction markets and trend analysis in platforms like Youtube, TikTok and Reddit. Real-world events are the messiest, most interesting modeling problems there are.',
  lead:
    'Most data scientists hand their models off at the door. I started on the other side of that door.',
  body: [
    "Before the Python, the MMM models and the statistics, I was thinking in campaigns, briefs, creatives, channel strategy. Then a master's degree pulled me toward the science, and I realized I had something most people don't: I could see marketing the way a data scientist does, and data the way a marketer does.",
    'For eight years, six of them embedded inside marketing teams, I\'ve used that lens to optimize spend across channels, connect what the numbers say to what teams actually do, and drag insights all the way from "huh, interesting" to "let\'s ship it."',
  ],
  kicker: "The model isn't the work. Getting it used is the work.",
  social: {
    github: 'https://github.com/germarr',
    linkedin: 'https://www.linkedin.com/in/martinezarroyogerardo/',
    instagram: 'https://www.instagram.com/gmarr.ai/',
  },
}
