# Frontend Infra CRA Baseline

Captured: 2026-07-10
Runtime: Node 24.14.0, Yarn 1.22.22
Source baseline: `refactor/remove-account-system` at `009493f8`

This is the Phase 0 comparison point for the Vite migration. Recreate the report with:

```bash
yarn workspace rath-client build
yarn build:report
yarn test:smoke
```

## Quality gates

- UI migration gates: pass, all Fluent/Fabric counters are zero.
- TypeScript: pass.
- Jest: 6 suites, 47 tests passed.
- Playwright Chromium production smoke: 2 tests passed.
- Root-path production build: application shell visible and computation Worker started.
- Unknown subpath `/rath/`: application shell visible, Worker started, no same-origin request failure.
- Visual check: Data Connections shell, navigation, search and footer render without an error overlay or blank state.

## Build baseline

- Clean production build wall time: 44.79 seconds.
- Files: 262.
- Total uncompressed output: 32,732,455 bytes.
- Gzip total for compressible files: 6,673,615 bytes.
- JavaScript files: 121.
- CSS files: 2.
- Worker files: 14: 12 Rath business Workers plus Monaco editor/json Workers.
- HTML entry script: `./static/js/main.e0478549.js`.
- Main JavaScript: 7,128,428 bytes / 1,846,558 gzip bytes.
- Largest lazy JavaScript chunk: 3,524,239 bytes / 954,117 gzip bytes.

The build succeeds but reports an outdated Browserslist database, large-bundle warnings, Node deprecations from the CRA toolchain, and unresolved/external warnings in the legacy Vega painter Rollup build. Those warnings are baseline observations; the Vite migration must not silently convert them into runtime failures.

## Comparison rules

- Hashes and chunk counts may change under Vite; behavior, not filename equality, is the primary gate.
- The Vite build must continue to produce exactly 12 Rath business Worker entry points plus the required Monaco Workers.
- Relative deployment, lazy pages, public datasets and localized assets must continue to work.
- Bundle comparisons must separate copied public datasets from executable JavaScript.
- No Vite result is accepted solely because `vite build` exits successfully; browser smoke and Worker/Monaco runtime checks are required.
