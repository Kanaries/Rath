# Frontend infra Phase 3/4: React 19 migration

Date: 2026-07-12
Status: complete; candidate, runtime, and final dependency-clean gates pass

## Outcome

Rath has been moved from the React `18.3.1` preparation baseline to this explicit compatibility candidate:

| Package | Candidate version | Result |
| --- | ---: | --- |
| React / React DOM / react-is | 19.2.7 | Typecheck, unit, build, and browser probe pass |
| `@types/react` / `@types/react-dom` | 19.2.17 / 19.2.3 | React 19 JSX/ref type migration complete |
| Graphic Walker | 0.5.2 | React 19 peer contract; real Rath Shadow DOM drag passes |
| modified react-beautiful-dnd | 0.2.1, transitive | React 18/19 peer contract; mouse, cancellation, and touch probes pass |
| styled-components | 6.4.3 | Rath uses an explicit `shouldForwardProp` policy |
| MobX / mobx-react-lite | 6.16.1 / 4.1.1 | Direct Rath integration supports React 19 |
| react-monaco-editor / Monaco | 0.59.0 / 0.52.2 | Editor and JSON Workers pass |
| re-resizable | 6.11.2 | React 19 peer contract |
| Testing Library React | 16.3.2 | Unit baseline passes |
| TypeScript | 5.9.3 | Kept below 6 because ts-jest 29 requires TypeScript `<6` |

The source audit finds no `ReactDOM.render`, `hydrate`, `findDOMNode`, `unmountComponentAtNode`, `react-dom/test-utils`, or `createFactory` calls. React 19's stricter types were addressed directly: JSX namespace imports, nullable refs, initialized refs, CSS custom properties, and styled-components 6 component-prop types. Strict checking was not disabled.

Graphic Walker 0.5.2 is runtime- and dependency-compatible with React 19. It still publishes overloaded call signatures returning `ReactNode`; TypeScript 5.9 rejects that particular declaration shape as JSX even though the runtime component works. Rath therefore keeps a typed adapter that preserves the complete local/remote prop overloads and narrows only the return to `ReactElement | null`. This is an upstream declaration ergonomics issue, not a React 18 dependency exception.

## Graphic Walker and DND probe

The isolated [`pocs/react19-graphic-walker`](../pocs/react19-graphic-walker/README.md) and the real Rath data flow were both exercised.

Passed behavior:

- Vite production build and React 19 Shadow DOM mount.
- Pointer drag from a field into Columns.
- Escape cancellation during an active drag.
- Long-press touch drag.
- Rath demo Cars load, Start Analysis, Exploration mount, and a real field drag.
- No page exception or React console error with Rath's styled-components 6.4.3 host policy.

DOM prop verification:

- Graphic Walker 0.5.2, styled-components 6.4.3, and Rath's `StyleSheetManager.shouldForwardProp` policy produce no invalid DOM-prop errors in either the canary or Rath.
- The canary keeps the same host policy as production so its console gate represents Rath's real integration.

## Final dependency cleanup

Graphic Walker 0.5.2 upgrades the former React 18-only transitive packages: Headless UI 2.2.10, React Leaflet 5.0.0, React Resizable Panels 4.12.1, React Resize Detector 12.3.0, and `@kanaries/react-beautiful-dnd` 0.2.1. The old `use-memo-one` dependency is absent.

`yarn audit:react19` now traverses the installed package tree and validates every declared React peer range with semver. The current install contains 85 React peer declarations and zero ranges incompatible with React 19.2.7. Both `yarn audit:react19` and the strict `yarn audit:react19:gate` pass. The former `ali-react-table` exception is also absent because DataSource now uses `RathDataTable`.

## Bundle impact

Graphic Walker's production chunk is approximately 5.19 MB / 1.45 MB gzip with 0.5.2, about +74 KB raw and +24 KB gzip compared with 0.5.1. This remains the dominant frontend chunk and should be tracked separately from React compatibility.

## Verification record

Verification on 2026-07-12:

- TypeScript `5.9.3`: pass.
- Jest: 6 suites / 49 tests pass.
- Full workspace production build: pass; Vite transformed 5,811 modules.
- Rath browser smoke: 7/7 pass, including production root/subpath startup, Worker startup, Tailwind/shadcn, DataSource virtualization/interactions, Monaco editor/JSON Workers, Graphic Walker Shadow DOM, and pointer DND.
- Isolated Graphic Walker canary: 3/3 pass for pointer drag, Escape cancellation, and touch drag with an empty console-error list.
- Installed React peer scan: 85 declarations checked, zero incompatible ranges; strict dependency gate passes.
- Worker count remains 14.

## Commands

```bash
yarn audit:react19
yarn audit:react19:gate
yarn tsc --noEmit -p packages/rath-client/tsconfig.json
yarn workspace rath-client test --runInBand
yarn build
yarn test:smoke

cd pocs/react19-graphic-walker
yarn test:functional
```
