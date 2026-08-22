# Frontend Agent Guide

This app was scaffolded with `remix new`. Use these conventions when continuing to build it out.

## Commands

```sh
npm i
npm run dev
npm run hmr
npm run start
npm test
npm run typecheck
```

`npm test` runs `remix test`, not Node's test runner. This matters: under
`node --test`, `remix/test`'s `describe`/`it` only register tests into an
in-memory array and nothing ever executes them — a test body containing an
unconditional `throw` still reports `pass, fail 0`. If you change the test
script, verify a deliberately failing test actually fails.

`playwright` is a devDependency even though there are no browser tests. It is
required by `remix test` itself: `@remix-run/test`'s compiled runner has an
unconditional import of `./playwright.js`, which statically imports
`playwright`, so the CLI cannot start without it even for server-only tests.
Do not remove it until upstream drops that import.

## Building Features

Refer to ./.agents/skills/remix/SKILL.md

## Starter Layout

- `app/actions/controller.tsx` owns the top-level route actions
- `app/actions/home-page.tsx` and `app/actions/document.tsx` render the route-owned starter UI
- `app/actions/public/` contains the browser runtime entry and interactive prompt button
- `app/routes.ts` defines the shared route contract used by server and browser modules for type-safe hrefs
- `app/router.ts` wires routes to route handlers
- `app/middleware/render.tsx` installs the request-scoped renderer used by actions
- `app/assets.ts` owns the server-side asset pipeline used by the asset route and renderer
- Root `public/` contains static files served unchanged from the app root

## Route Ownership

- Start from `app/routes.ts` and map each route to the narrowest owner on disk.
- Put top-level route actions in `app/actions/controller.tsx`.
- Add `app/actions/<route-key>/controller.tsx` for nested route maps that need their own actions or middleware.
- Keep route-owned page modules next to the route that owns them.
- Move shared UI to `app/ui/`, not `app/actions/`.

## Build-Out Notes

- This starter intentionally begins small; add directories like `app/data/` and `test/` only when you need them.
- Prefer putting code in the narrowest owner before introducing shared modules.
- Avoid generic dumping-ground directories like `app/lib/` or `app/components/`.
