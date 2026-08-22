import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { renderToString } from 'remix/ui/server'

import { PROJECTS } from '../data/projects.ts'
import { Thumbnail } from './thumbnail.tsx'

describe('Thumbnail', () => {
  it('renders an svg with the fixed viewBox, width, height, and aria-hidden for every project kind', async () => {
    for (let project of PROJECTS) {
      let html = await renderToString(<Thumbnail project={project} />)
      assert.match(html, /<svg viewBox="0 0 320 200" width="100%" height="100%" aria-hidden="true"/)
    }
  })

  it('produces non-empty, NaN-free `d` attributes for every project kind', async () => {
    for (let project of PROJECTS) {
      let html = await renderToString(<Thumbnail project={project} />)
      let dAttrs = [...html.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]!)
      assert.equal(dAttrs.length > 0, true)
      for (let d of dAttrs) {
        assert.equal(d.trim() === '', false)
        assert.equal(d.includes('NaN'), false)
      }
    }
  })

  it("places the line motif's end dot exactly on the last point of its polyline", async () => {
    let project = PROJECTS.find((p) => p.kind === 'line')!
    let html = await renderToString(<Thumbnail project={project} />)

    let lineMatch = html.match(
      / d="([^"]+)" fill="none" stroke="var\(--accent\)" stroke-width="1\.9"/,
    )
    assert.ok(lineMatch)
    let commands = lineMatch![1]!.trim().split(/(?=[ML])/)
    let last = commands[commands.length - 1]!.trim().slice(1).trim().split(/\s+/)

    let circleMatch = html.match(/<circle cx="([^"]+)" cy="([^"]+)" r="4\.6"/)
    assert.ok(circleMatch)
    assert.equal(circleMatch![1], last[0])
    assert.equal(circleMatch![2], last[1])
  })

  it("renders the kindLabel over the thumbnail's own background", async () => {
    let project = PROJECTS[0]!
    let html = await renderToString(<Thumbnail project={project} />)
    assert.match(html, new RegExp(`>${project.kindLabel}<`))
  })
})
