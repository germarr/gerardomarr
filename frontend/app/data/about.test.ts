import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { ABOUT } from './about.ts'

/**
 * These strings are the site owner's own words, transcribed from
 * personal_notes.md. They have been silently reworded twice during this
 * build -- a dropped comma here, an em-dash list there, "Youtube" corrected
 * to "YouTube" -- each time by something trying to improve the prose.
 *
 * Pinning them exactly makes any such change fail loudly instead of shipping.
 * If the owner genuinely revises their copy, update these expectations in the
 * same commit. Do NOT relax the assertions to make an edit pass.
 */
describe('ABOUT copy fidelity', () => {
  it('keeps the intro exactly as written', () => {
    assert.equal(
      ABOUT.intro,
      'Data Scientist with expertise in Marketing Mix Models, campaign optimization, and ' +
        'full-funnel marketing analytics. Outside work, I chase alternative datasets like ' +
        'football, theme parks, prediction markets and trend analysis in platforms like ' +
        'Youtube, TikTok and Reddit. Real-world events are the messiest, most interesting ' +
        'modeling problems there are.',
    )
  })

  it('keeps the About lead exactly as written', () => {
    assert.equal(
      ABOUT.lead,
      'Most data scientists hand their models off at the door. I started on the other side ' +
        'of that door.',
    )
  })

  it('keeps the closing line exactly as written', () => {
    assert.equal(ABOUT.kicker, "The model isn't the work. Getting it used is the work.")
  })

  it('keeps the social links as unfilled placeholders until real ones are supplied', () => {
    // Guards against anything inventing plausible-looking handles.
    assert.equal(ABOUT.social.github, '[YOUR GITHUB URL]')
    assert.equal(ABOUT.social.linkedin, '[YOUR LINKEDIN URL]')
    assert.equal(ABOUT.social.instagram, '[YOUR INSTAGRAM URL]')
  })
})
