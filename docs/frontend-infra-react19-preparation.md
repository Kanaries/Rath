# Frontend infra Phase 3/4: React 19 compatibility probe

Date: 2026-07-11
Status: Rath React 19 candidate passes the current automated probe; final dependency-clean gate is deferred

## Outcome

Rath has been moved from the React `18.3.1` preparation baseline to this explicit compatibility candidate:

| Package | Candidate version | Result |
| --- | ---: | --- |
| React / React DOM / react-is | 19.2.7 | Typecheck, unit, build, and browser probe pass |
| `@types/react` / `@types/react-dom` | 19.2.17 / 19.2.3 | React 19 JSX/ref type migration complete |
| Graphic Walker | 0.5.1 | React 19 peer contract; real Rath Shadow DOM drag passes |
| modified react-beautiful-dnd | 0.2.0, transitive | React 18/19 peer contract; mouse, cancellation, and touch probes pass |
| styled-components | 6.4.3 | Rath uses an explicit `shouldForwardProp` policy |
| MobX / mobx-react-lite | 6.16.1 / 4.1.1 | Direct Rath integration supports React 19 |
| react-monaco-editor / Monaco | 0.59.0 / 0.52.2 | Editor and JSON Workers pass |
| re-resizable | 6.11.2 | React 19 peer contract |
| Testing Library React | 16.3.2 | Unit baseline passes |
| TypeScript | 5.9.3 | Kept below 6 because ts-jest 29 requires TypeScript `<6` |

The source audit finds no `ReactDOM.render`, `hydrate`, `findDOMNode`, `unmountComponentAtNode`, `react-dom/test-utils`, or `createFactory` calls. React 19's stricter types were addressed directly: JSX namespace imports, nullable refs, initialized refs, CSS custom properties, and styled-components 6 component-prop types. Strict checking was not disabled.

Graphic Walker 0.5.1 publishes a callable overload returning `ReactNode`; TypeScript 5.9 rejects that particular declaration shape as JSX even though the runtime component works. Rath temporarily uses a typed adapter that preserves the complete local/remote prop overloads and narrows only the return to `ReactElement | null`. This should be removed after Graphic Walker corrects its declaration.

## Graphic Walker and DND probe

The isolated [`pocs/react19-graphic-walker`](../pocs/react19-graphic-walker/README.md) and the real Rath data flow were both exercised.

Passed behavior:

- Vite production build and React 19 Shadow DOM mount.
- Pointer drag from a field into Columns.
- Escape cancellation during an active drag.
- Long-press touch drag.
- Rath demo Cars load, Start Analysis, Exploration mount, and a real field drag.
- No page exception or React console error with Rath's styled-components 6.4.3 host policy.

DOM prop investigation:

- styled-components 6.1.19 reproduces `isDragging`, `rowSize`, `colSize`, and `colType` DOM warnings/errors.
- styled-components 6.4.3 plus Rath's `StyleSheetManager.shouldForwardProp` removes them in both the canary and the Rath development build.
- The library still forwards private styling props internally, so an upstream local fix is appropriate; a reusable library should not depend on every host configuring a global prop filter.

An independent Agent Session implemented that upstream fix in the local Graphic Walker repository on branch `codex/react19-dom-props` (uncommitted and unpushed): scoped prop filters for `colType`, `isDragging`, `noShadow`, and `noBorder`; transient `$rowSize`/`$colSize`; DND 0.2.0 alignment; and `ReactElement | null` public return declarations. Its React 19 browser drag has zero leaked attributes/errors, Jest passes 9 suites / 69 tests, and its full build/declaration generation passes.

## Deferred dependency cleanup

This round is a compatibility probe, not final certification. Installation still reports React 18-only peer declarations from:

- Graphic Walker's `@headlessui/react@1.7.12`;
- Graphic Walker's nested `mobx-react-lite@3.4.x` and `re-resizable@6.9.9`;
- `react-leaflet@4.2.1` / `@react-leaflet/core@2.1.0`;
- `react-resizable-panels@1.0.10`;
- `react-resize-detector@9.1.1`;
- DND's `use-memo-one@1.1.3`.

Rath does not add Yarn resolutions to force those transitive packages. Their upgrade/removal belongs to Graphic Walker's dependency cleanup. The former `ali-react-table` compatibility exception has been removed by migrating the final DataSource instance to `RathDataTable`.

`yarn audit:react19` validates the candidate and succeeds in CI. `yarn audit:react19:gate` remains intentionally red while React 18-only peer declarations are present.

## Bundle impact

Graphic Walker's production chunk changed from approximately 4.21 MB / 1.14 MB gzip on the React 18 baseline to 5.12 MB / 1.42 MB gzip in this candidate: about +0.91 MB raw and +0.29 MB gzip. This is a measurable regression and should be revisited when Graphic Walker removes duplicated/obsolete dependencies.

## Verification record

Verification on 2026-07-11:

- TypeScript `5.9.3`: pass.
- Jest: 6 suites / 47 tests pass.
- Full workspace production build: pass; Vite transformed 6,027 modules in 1.51 seconds.
- Rath browser smoke: 5/5 pass, including production root/subpath startup, Worker startup, Tailwind/shadcn, MobX navigation, Monaco editor/JSON Workers, demo data, Graphic Walker Shadow DOM, and pointer DND.
- Isolated Graphic Walker canary: 3/3 pass for pointer drag, Escape cancellation, and touch drag with an empty console-error list.
- Worker count remains 14.
- Production artifact: 205 files, 31,272,997 bytes; compressible gzip total 6,472,439 bytes.

## Commands

```bash
yarn audit:react19
yarn audit:react19:gate # expected to fail until transitive dependency cleanup is complete
yarn tsc --noEmit -p packages/rath-client/tsconfig.json
yarn workspace rath-client test --runInBand
yarn build
yarn test:smoke

cd pocs/react19-graphic-walker
yarn test:functional
```
