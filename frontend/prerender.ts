import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { router } from './app/router.ts'
import { allPosts } from './app/data/posts.ts'
import { slugifyTag, stackTags } from './app/data/projects.ts'
import { routes } from './app/routes.ts'

const OUT_DIR = path.resolve(process.cwd(), 'dist')
const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const ORIGIN = 'http://localhost'

function urlsToRender(): string[] {
  return [
    routes.home.href(),
    routes.projects.index.href(),
    ...stackTags().map((tag) => routes.projects.byStack.href({ tag: slugifyTag(tag) })),
    routes.writing.index.href(),
    ...allPosts().map((post) => routes.writing.post.href({ slug: post.slug })),
  ]
}

/** `/projects/stack/python` -> `dist/projects/stack/python/index.html` */
function outputPath(href: string): string {
  let relative = href === '/' ? '' : href.replace(/^\//, '')
  return path.join(OUT_DIR, relative, 'index.html')
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUT_DIR, { recursive: true })

  let urls = urlsToRender()
  let failures: string[] = []

  for (let href of urls) {
    let response = await router.fetch(new Request(ORIGIN + href))

    if (response.status !== 200) {
      failures.push(`${href} -> ${response.status}`)
      continue
    }

    let html = await response.text()
    let file = outputPath(href)
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, html)
    console.log(`wrote ${href} -> ${path.relative(process.cwd(), file)}`)
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} URL(s) failed to prerender:`)
    for (let failure of failures) console.error(`  ${failure}`)
    process.exit(1)
  }

  await copyPublic()

  console.log(`\nPrerendered ${urls.length} page(s) to ${path.relative(process.cwd(), OUT_DIR)}`)
}

async function copyPublic() {
  let exists = await fs
    .stat(PUBLIC_DIR)
    .then((stat) => stat.isDirectory())
    .catch(() => false)
  if (!exists) return

  await fs.cp(PUBLIC_DIR, OUT_DIR, { recursive: true })
  console.log(`copied public/ -> ${path.relative(process.cwd(), OUT_DIR)}`)
}

await main()
