import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { renderToString } from 'remix/ui/server'

import { PROJECTS } from '../data/projects.ts'
import { ProjectCard } from './project-card.tsx'

describe('ProjectCard', () => {
  it('renders exactly one anchor per card, wrapping the whole thing, with the real project url as href', async () => {
    for (let project of PROJECTS) {
      let html = await renderToString(<ProjectCard project={project} />)
      let anchorOpenTags = html.match(/<a /g) ?? []
      assert.equal(anchorOpenTags.length, 1)
      assert.match(html, new RegExp(`<a href="${project.url.replace(/[.]/g, '\\.')}"`))
    }
  })

  it('renders every project.tech entry as a chip', async () => {
    let project = PROJECTS.find((p) => p.tech.length > 3)!
    let html = await renderToString(<ProjectCard project={project} />)
    for (let tag of project.tech) {
      assert.match(html, new RegExp(`>${tag.replace(/[.]/g, '\\.')}<`))
    }
  })

  it('emits distinct sizes for the index and home variants', async () => {
    let project = PROJECTS[0]!
    let indexHtml = await renderToString(<ProjectCard project={project} variant="index" />)
    let homeHtml = await renderToString(<ProjectCard project={project} variant="home" />)
    assert.match(indexHtml, /font-size:\s*18px/)
    assert.match(homeHtml, /font-size:\s*15px/)
    assert.equal(indexHtml.includes('font-size:15px') || indexHtml.includes('font-size: 15px'), false)
  })

  it('compiles the nested &:hover selectors into real CSS rules for name colour and arrow shift', async () => {
    let project = PROJECTS[0]!
    let html = await renderToString(<ProjectCard project={project} />)
    // Find the generated class name applied to the card anchor and its emitted rule block.
    let anchorTag = /<a\s[^>]*>/.exec(html)
    assert.ok(anchorTag)
    let anchorClass = /class="([^"]+)"/.exec(anchorTag![0]!)
    assert.ok(anchorClass)
    let cls = anchorClass![1]!.split(' ')[0]!
    let styleMatch = /<style[^>]*>([\s\S]*?)<\/style>/.exec(html)
    assert.ok(styleMatch)
    let sheet = styleMatch![1]!
    assert.match(sheet, new RegExp(`\\.${cls}\\s*\\{[\\s\\S]*&:hover \\.card-name \\{[\\s\\S]*?color:\\s*var\\(--accent\\)`))
    assert.match(sheet, new RegExp(`\\.${cls}\\s*\\{[\\s\\S]*&:hover \\.card-go \\{[\\s\\S]*?transform:\\s*translate\\(2px, -2px\\)`))
  })

  it('opens external project links in a new tab with a safe rel and a concise accessible name', async () => {
    let project = PROJECTS[0]!
    let html = await renderToString(<ProjectCard project={project} />)
    let anchorTag = /<a\s[^>]*>/.exec(html)
    assert.ok(anchorTag)
    assert.match(anchorTag![0]!, /target="_blank"/)
    assert.match(anchorTag![0]!, /rel="noopener noreferrer"/)
    assert.match(
      anchorTag![0]!,
      new RegExp(`aria-label="${project.name}, ${project.host} \\(opens in a new tab\\)"`),
    )
  })

  it('stretches the info column and pins the tag row to the card\'s bottom edge, so a taller neighbour in a grid row does not leave a gap under a shorter card\'s tags', async () => {
    let project = PROJECTS[0]!
    let html = await renderToString(<ProjectCard project={project} variant="home" />)
    assert.match(html, /flex:\s*1 1 auto/)
    assert.match(html, /margin-top:\s*auto/)
  })
})
