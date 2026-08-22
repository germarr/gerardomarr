import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { PROJECTS, featuredProjects, projectsByStack, stackTags } from './projects.ts'

describe('PROJECTS', () => {
  it('marks exactly three as featured', () => {
    assert.equal(featuredProjects().length, 3)
  })

  it('gives every project a non-empty stack', () => {
    for (let project of PROJECTS) assert.equal(project.tech.length > 0, true)
  })

  it('gives bars and line projects a series to plot', () => {
    for (let project of PROJECTS) {
      if (project.kind === 'bars' || project.kind === 'line') {
        assert.equal(project.series.length > 1, true)
      }
    }
  })

  it('has unique ids', () => {
    assert.equal(new Set(PROJECTS.map((p) => p.id)).size, PROJECTS.length)
  })
})

describe('stackTags', () => {
  it('derives tags from the projects themselves, most common first', () => {
    let tags = stackTags()
    assert.equal(tags.includes('Python'), true)
    assert.equal(tags[0], 'FastAPI')
  })

  it('lists each tag once', () => {
    assert.equal(new Set(stackTags()).size, stackTags().length)
  })
})

describe('projectsByStack', () => {
  it('filters on the slugified tag', () => {
    let filtered = projectsByStack('python')
    assert.equal(filtered.length > 0, true)
    for (let project of filtered) assert.equal(project.tech.includes('Python'), true)
  })

  it('returns nothing for an unknown tag', () => {
    assert.deepEqual(projectsByStack('cobol'), [])
  })
})
