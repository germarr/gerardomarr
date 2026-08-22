import { createController } from 'remix/router'

import { allPosts, findPost } from '../../data/posts.ts'
import { routes } from '../../routes.ts'
import { ArticlePage } from './article-page.tsx'
import { WritingPage } from './writing-page.tsx'

export default createController(routes.writing, {
  actions: {
    index({ render }) {
      return render(<WritingPage posts={allPosts()} />)
    },

    post({ render, params }) {
      let post = findPost(params.slug)
      if (!post) return new Response('Not Found', { status: 404 })
      return render(<ArticlePage post={post} />)
    },
  },
})
