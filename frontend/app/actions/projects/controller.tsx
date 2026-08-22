import { createController } from 'remix/router'

import { PROJECTS, projectsByStack } from '../../data/projects.ts'
import { routes } from '../../routes.ts'
import { ProjectsPage } from './projects-page.tsx'

export default createController(routes.projects, {
  actions: {
    index({ render }) {
      return render(<ProjectsPage projects={PROJECTS} total={PROJECTS.length} activeTag={null} />)
    },

    byStack({ render, params }) {
      let tag = params.tag
      return render(
        <ProjectsPage projects={projectsByStack(tag)} total={PROJECTS.length} activeTag={tag} />,
      )
    },
  },
})
