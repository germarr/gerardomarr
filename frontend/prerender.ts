/**
 * Renders every route to a static `dist/` tree suitable for Azure Static Web Apps.
 *
 * Remix 3's asset server doesn't bundle — it transforms modules on demand and
 * serves them from `/assets/*`. A static host has no such server, so this script
 * mirrors that output to disk:
 *
 *   1. Render each route in-process via `router.fetch()` -> `dist/<route>/index.html`.
 *   2. Seed an asset queue from the entry module graph plus every `/assets/*` URL
 *      the rendered HTML references.
 *   3. Drain the queue breadth-first, saving each response and following the
 *      imports of anything that turns out to be JavaScript.
 *   4. Copy `public/` and emit `staticwebapp.config.json`.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { assetServer, entryHref, entryPreloads } from './app/assets.ts'
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

/**
 * Static hosts decode a URL before looking up the file on disk, so a request for
 * `/assets/node_modules/%40remix-run/...` reads `node_modules/@remix-run/...`.
 * `decodeURI` leaves reserved characters like `%40` alone, so decode each path
 * segment individually.
 */
function assetOutputPath(url: string): string {
  let withoutQuery = url.split('?')[0]!
  let decoded = withoutQuery
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .join('/')
  return path.join(OUT_DIR, decoded.replace(/^\//, ''))
}

function extractUrlsFromHtml(html: string): string[] {
  let urls = new Set<string>()
  let patterns = [
    /<script[^>]+src=["']([^"']+)["']/g,
    /<link[^>]+href=["']([^"']+)["']/g,
    /"moduleUrl"\s*:\s*"([^"]+)"/g,
  ]
  for (let pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(html)) !== null) urls.add(match[1]!)
  }
  return [...urls]
}

/**
 * Matches every static or dynamic import target. This runs against minified
 * output, so it can't rely on whitespace anywhere. Dynamic `import(variable)`
 * with a non-literal specifier can't be resolved statically — those are covered
 * by seeding the queue from `entryPreloads`.
 */
function extractUrlsFromJs(source: string): string[] {
  let urls = new Set<string>()
  let patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ]
  for (let pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source)) !== null) urls.add(match[1]!)
  }
  return [...urls]
}

function looksLikeModule(url: string, contentType: string | null): boolean {
  if (contentType && /javascript|typescript/i.test(contentType)) return true
  return /\.(m?js|c?js|ts|tsx|jsx)(\?|$)/.test(url)
}

async function renderPages(failures: string[]): Promise<string[]> {
  let assetUrls = new Set<string>()

  for (let href of urlsToRender()) {
    let response = await router.fetch(new Request(ORIGIN + href))

    if (response.status !== 200) {
      failures.push(`${href} -> ${response.status}`)
      continue
    }

    let html = await response.text()
    let file = outputPath(href)
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, html)

    for (let url of extractUrlsFromHtml(html)) {
      if (url.startsWith('/assets/')) assetUrls.add(url)
    }

    console.log(`wrote ${href} -> ${path.relative(process.cwd(), file)}`)
  }

  return [...assetUrls]
}

/**
 * Drains the asset queue, writing each response to disk and following the
 * imports of any JavaScript it finds. Every enqueued URL is one the browser will
 * eventually request, so a non-200 is a hard failure — a silent 404 here ships a
 * site whose client JS never boots.
 */
async function emitAssets(seeds: string[], failures: string[]): Promise<number> {
  let queue = [...seeds]
  let seen = new Set<string>()
  let written = 0

  while (queue.length > 0) {
    let url = queue.shift()!
    if (seen.has(url) || !url.startsWith('/assets/')) continue
    seen.add(url)

    let response = await router.fetch(new Request(ORIGIN + url))
    if (response.status !== 200) {
      failures.push(`${url} -> ${response.status}`)
      continue
    }

    let body = Buffer.from(await response.arrayBuffer())
    let file = assetOutputPath(url)
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, body)
    written++

    if (looksLikeModule(url, response.headers.get('content-type'))) {
      for (let next of extractUrlsFromJs(body.toString('utf8'))) {
        if (next.startsWith('/assets/')) queue.push(next)
      }
    }
  }

  return written
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

/**
 * Asset URLs keep their source extension, so `.ts`/`.tsx` modules need an
 * explicit MIME type — with `nosniff` set the browser refuses to execute them
 * otherwise. There is no `navigationFallback`: every route has a real
 * `index.html` on disk, and a fallback would answer unknown URLs with a 200.
 */
async function writeAzureConfig() {
  let config = {
    mimeTypes: {
      '.ts': 'application/javascript',
      '.tsx': 'application/javascript',
    },
    routes: [
      {
        route: '/assets/*',
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      },
    ],
    globalHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  }

  let file = path.join(OUT_DIR, 'staticwebapp.config.json')
  await fs.writeFile(file, JSON.stringify(config, null, 2) + '\n')
  console.log(`wrote ${path.relative(process.cwd(), file)}`)
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUT_DIR, { recursive: true })

  let failures: string[] = []

  let htmlAssetUrls = await renderPages(failures)
  let assetCount = await emitAssets([entryHref, ...entryPreloads, ...htmlAssetUrls], failures)

  if (failures.length > 0) {
    console.error(`\n${failures.length} URL(s) failed to prerender:`)
    for (let failure of failures) console.error(`  ${failure}`)
    process.exit(1)
  }

  await copyPublic()
  await writeAzureConfig()

  console.log(`\nPrerendered ${urlsToRender().length} page(s) and ${assetCount} asset(s) to ${path.relative(process.cwd(), OUT_DIR)}`)
}

try {
  await main()
} finally {
  assetServer.close()
}
