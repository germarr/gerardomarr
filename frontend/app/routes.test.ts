import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { routes } from './routes.ts'

describe('route contract', () => {
  it('generates every URL the site links to', () => {
    assert.equal(routes.home.href(), '/')
    assert.equal(routes.projects.index.href(), '/projects')
    assert.equal(routes.projects.byStack.href({ tag: 'python' }), '/projects/stack/python')
    assert.equal(routes.writing.index.href(), '/writing')
    assert.equal(routes.writing.post.href({ slug: 'hello-world' }), '/writing/hello-world')
  })
})
