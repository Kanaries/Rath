# React 19 + Graphic Walker canary

This isolated canary verifies the Graphic Walker version used by Rath against React 19 independently from the main application.

Pinned candidate:

- React / React DOM `19.2.7`
- Graphic Walker `0.5.2`
- `@kanaries/react-beautiful-dnd` `0.2.1` (transitive)
- styled-components `6.4.3`

Run it independently (do not add this directory to the root Yarn 1 workspaces):

```bash
cd pocs/react19-graphic-walker
yarn install
yarn build
yarn test:functional
```

## Current result (2026-07-12)

- Production build: pass (`5.42 MB` JavaScript, approximately `1.52 MB` gzip).
- React 19 render inside Graphic Walker's Shadow DOM: pass.
- Mouse drag, Escape cancellation, and long-press touch drag: pass.
- Browser page exceptions: none.
- React console quality gate: pass with styled-components `6.4.3` and the host `StyleSheetManager.shouldForwardProp` policy used by Rath.
- Graphic Walker's updated transitive packages declare React 19-compatible peer ranges; the old `use-memo-one` dependency is no longer installed.
- Graphic Walker `0.5.2` still publishes overloaded `GraphicWalker` call signatures returning `ReactNode`, which TypeScript 5.9 rejects as JSX under this overload shape. Rath keeps a typed adapter that preserves the package props and narrows only the runtime return.

The functional tests require an empty console-error list. Together with Rath's installed-peer audit, this canary is part of the final React 19 gate.
