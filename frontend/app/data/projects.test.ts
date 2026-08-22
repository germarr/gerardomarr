import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { PROJECTS, featuredProjects, projectsByStack, slugifyTag, stackTags } from './projects.ts'

describe('PROJECTS', () => {
  it('marks exactly three as featured', () => {
    assert.equal(featuredProjects().length, 3)
  })

  it('features exactly la cancha, queue scope, and trending', () => {
    let ids = featuredProjects()
      .map((p) => p.id)
      .sort()
    assert.deepEqual(ids, ['lacancha', 'queuescope', 'trending'].sort())
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

  it('gives every project a series that matches its thumbnail motif', () => {
    let GRID_CELLS = 40 // 8 columns x 5 rows

    for (let project of PROJECTS) {
      switch (project.kind) {
        case 'line':
          assert.equal(project.series.length >= 2, true)
          break
        case 'bars':
          assert.equal(project.series.length >= 1, true)
          assert.equal(Math.max(...project.series) > 0, true)
          break
        case 'grid': {
          for (let index of project.series) {
            assert.equal(Number.isInteger(index), true)
            assert.equal(index >= 0 && index < GRID_CELLS, true)
          }
          assert.equal(new Set(project.series).size, project.series.length)
          break
        }
        case 'pitch':
          // Fixed geometry; no series requirements.
          break
      }
    }
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

  it('never lets two different tags collapse onto the same slug', () => {
    let slugs = stackTags().map((tag) => slugifyTag(tag))
    assert.equal(new Set(slugs).size, slugs.length)
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
