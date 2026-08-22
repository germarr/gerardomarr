import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  projects: route('projects', {
    index: '/',
    byStack: get('stack/:tag'),
  }),
  writing: route('writing', {
    index: '/',
    post: get(':slug'),
  }),
})
