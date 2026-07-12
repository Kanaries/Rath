# React 19 + Graphic Walker canary

This isolated canary keeps React 19 experiments out of the Rath production dependency graph.

Pinned candidate:

- React / React DOM `19.2.7`
- Graphic Walker `0.5.1`
- `@kanaries/react-beautiful-dnd` `0.2.0` (transitive)
- styled-components `6.4.3`

Run it independently (do not add this directory to the root Yarn 1 workspaces):

```bash
cd pocs/react19-graphic-walker
yarn install
yarn build
yarn test:functional
```

## Current result (2026-07-11)

- Production build: pass (`5.34 MB` JavaScript, approximately `1.50 MB` gzip).
- React 19 render inside Graphic Walker's Shadow DOM: pass.
- Mouse drag, Escape cancellation, and long-press touch drag: pass.
- Browser page exceptions: none.
- React console quality gate: pass with styled-components `6.4.3` and the host `StyleSheetManager.shouldForwardProp` policy used by Rath.
- The same test on styled-components `6.1.19` reproduces invalid `isDragging`, `rowSize`, `colSize`, and `colType` DOM props. Graphic Walker should still filter its private styling props locally instead of depending on host policy.
- `@kanaries/react-beautiful-dnd@0.2.0` formally supports React 18/19. Its `use-memo-one` dependency and several other Graphic Walker transitive UI packages still publish React 18-only peer ranges.
- Graphic Walker `0.5.1`'s callable `GraphicWalker` declaration returns `ReactNode`, which TypeScript 5.9 rejects as a JSX component under this overload shape. Rath temporarily narrows that return through a typed adapter without changing props or runtime behavior.

The functional tests require an empty console-error list. This canary is a compatibility probe, not a claim that every Graphic Walker transitive dependency has completed its React 19 migration.
