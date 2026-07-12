# Frontend Infra Phase 1: Vite Migration

Status: implemented and verified in Rath on 2026-07-10
Runtime: Node 24.14.0, Yarn 1.22.22, React 18.2, Tailwind 3.4
Build stack: Vite 8.1.4, `@vitejs/plugin-react` 6.0.3

## Outcome

Rath now uses Vite for development and production builds. CRA, `react-app-rewired`, `worker-loader`, the Webpack override, the Monaco Webpack plugin and their analysis/TypeScript loader dependencies have been removed. React and Tailwind intentionally remain unchanged for this phase.

The migration keeps `base: './'` so one build can be hosted at the origin root or below an unknown path. Public asset URLs used by runtime code are resolved through `import.meta.env.BASE_URL` instead of assuming `/`.

## Worker migration

The existing business Worker imports already used a `?worker` suffix. Vite supports this syntax natively, so their call sites only needed removal of obsolete Webpack lint suppressions and `@ts-ignore` comments. No Worker source or message protocol was changed.

Production output contains 14 independent Worker files:

- 12 Rath business Workers: engine, meta inference, LOA, clean, filter, lab distribution, R insight, field metadata, date expansion, causal computation, causal discovery and file transformation;
- 2 Monaco Workers: editor and JSON.

Monaco no longer uses `monaco-editor-webpack-plugin`. `src/monaco/vite.ts` imports the editor and JSON workers explicitly and supplies `globalThis.MonacoEnvironment.getWorker`.

## Loader and runtime mapping

| CRA/Webpack behavior | Vite replacement | Migration impact |
| --- | --- | --- |
| `worker-loader` for `.worker.ts/.js` | native `?worker` imports | Worker sources and constructors unchanged |
| `monaco-editor-webpack-plugin` | explicit Monaco `?worker` imports | two supported labels registered centrally |
| Webpack `ProvidePlugin` and `resolve.fallback.buffer` | explicit `buffer` import and a narrow `globalThis.Buffer` assignment | avoids a broad Node polyfill plugin |
| `process.env.NODE_ENV` | typed `import.meta.env.MODE/DEV/PROD` adapter | Jest maps the adapter to a deterministic test stub |
| `process.env.EXPAND_ENV` | `import.meta.env.VITE_EXPAND_ENV` | environment variable is now client-explicit |
| CRA public HTML interpolation/copying | Vite root `index.html` plus `public/` copying | old `public/index.html` removed |
| CSS/PostCSS inside CRA | `postcss.config.cjs` with Tailwind 3 and Autoprefixer | no CSS source rewrite in this phase |
| Webpack aliases | Vite aliases for `components`, `utils` and `runtime-env` | existing absolute imports remain valid |
| `source-map-explorer` | Vite analysis-mode sourcemap build plus deterministic build report | large chunks stay visible without CRA |

No raw, file, URL, SVG-component or WASM loader was present in Rath source. Images, fonts, JSON and other public files continue to use Vite's normal asset handling or `public/` copying.

## Bootstrap and Insider overlay seam

`src/index.tsx` now performs only the narrow browser compatibility setup and starts the shared bootstrap. The bootstrap awaits an optional `beforeStart` hook before dynamically importing the business application bundle. Rath uses the empty adapter and starts immediately. Insider can replace only `src/bootstrap/plugin.ts` with its authorization adapter so the normal SaaS application bundle is not loaded before authorization completes.

This is intentionally a lifecycle gate, not static-chunk access control. Provider wrapping is available now; route and navigation extension points remain a later plugin-API phase.

## Verification

| Gate | CRA baseline | Vite result |
| --- | ---: | ---: |
| clean client build | 44.79 s | 1.4–2.3 s |
| output files | 262 | 203 |
| total uncompressed output | 32,732,455 B | 29,515,434 B |
| gzip total for compressible files | 6,673,615 B | 5,962,764 B |
| JavaScript files | 121 | 146 |
| CSS files | 2 | 4 |
| Worker files | 14 | 14 |
| TypeScript | pass | pass |
| Jest | 47/47 | 47/47 |
| Chromium production smoke | 2/2 | 2/2 |

The production smoke covers `/` and `/rath/`, asserts the application shell and navigation are visible, observes at least one live Worker, and fails on browser exceptions or failed same-origin requests. The full workspace build also passes after declaring `rimraf` in the `vega-scenegraph` workspace that actually uses it; CRA had previously supplied that executable only as an accidental transitive dependency.

## Residual risks and rollback

- Several existing product chunks remain above Vite's 500 kB warning threshold, led by Graphic Walker, Monaco, causal logic and Airtable. This is a performance backlog, not a migration regression; lazy-loading behavior remains intact.
- The legacy Vega painter Rollup build still emits unresolved/external and circular dependency warnings. These warnings existed at baseline and do not block the verified browser flow.
- Only editor and JSON Monaco language workers are registered because those are the configured Rath languages. Adding a Monaco language requires adding its Worker mapping.
- Rollback is the Phase 0 CRA baseline. Vite, Tailwind 4 and React 19 remain separate changes so this phase can be reverted independently.
