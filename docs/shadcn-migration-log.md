# shadcn Migration Log

This file records execution evidence and intentional deviations from
`docs/shadcn-migration-execution.md` so follow-up agents do not need to
re-audit decisions from chat history.

## 2026-07-09

### Stage 0.4 Insider reverse sync

Repository checked: `/Users/claw/Documents/rath-workspace/RATH-insider`

- Branch: `codex/port-rath-feature-parity`
- Worktree: clean
- Remote state: ahead of `origin/codex/port-rath-feature-parity` by 1 commit
- Required picked commits are present:
  - `978e75c6` - text pattern induction refactor
  - `e33b34b6` - text pattern selection with exclude
  - `03f6126e` - painter missing-limits fix
  - `081a5a80` - lazy load app pages
  - `f06dcd18` - local causal discovery
  - `904e8785` - hashing bin size overflow fix, equivalent to Rath `e797f047`
- Painter fix parity:
  - `packages/rath-client/src/pages/painter/index.tsx` from Insider `03f6126e`
    matches Rath `68763882`.
  - `packages/vega-renderer/src/painter/util/paint.js` from Insider `03f6126e`
    matches Rath `68763882`.
- Excluded Rath commits were not found in `main..HEAD`:
  - `5029ae04` / `0fba9ba4` self-hosted icon font work
  - `f3c8cc47` lucide icon work

No merge to Insider `main` was performed. The branch is ready for the user to
decide whether it should be merged into the frozen Insider mainline.

### Stage 8 gate and runtime evidence

The final Fluent teardown checks have reached the intended zero state:

- `scripts/ui-migration-gates.sh`: all reported counts are `0`.
- `node scripts/audit-fluent-teardown.mjs --strict`: passed.
- `node scripts/ui-migration-report.mjs`: Stage 4-8 summary shows no remaining
  Fluent, Fabric, old icon API, provider, font, or lockfile residue.
- `yarn workspace rath-client build`: passed.
- `packages/icons` now uses `lucide-react`; the remaining
  `@fluentui/react-icons` workspace dependency and lockfile entries were
  removed as part of the final teardown.

Browser runtime checks covered the following paths on `http://127.0.0.1:3010`:

- App entry loads without missing icon/font/image failures.
- Language menu opens and switches between English, Japanese, and Korean.
- Cars demo import reaches DataSource with `9 columns x 406 rows`.
- Data Copilot creates a chart from `Miles_per_Gallon` and `Cylinders`.
- Chart export dialog opens and exposes PNG, filename, size, DPI, background,
  Export, Cancel, and Close controls.
- Data Painter opens from a generated chart, renders the main canvas and tool
  controls, and accepts a drag interaction on the canvas.
- Preferences dialog opens; Basic and Design tabs render; custom theme editor
  is reachable.
- Database connection form renders; disabled controls are consistent with the
  connector-offline/current-empty-URI state.
- Causal, Collection, and Dashboard routes render their reachable states.

Additional current-state audit:

- `.github/workflows/auto-build.yml` now targets `master` and `dev` for push and
  pull request events, matching the execution document's Rath branch fact.
- Causal was retested with Cars data:
  - Dataset panel renders the selected-field table with 9 fields.
  - Next advances to the discovery/model step.
  - Causal tabs render: AutoVis, CrossFilter, CausalInsight, GraphicWalker,
    predict.
  - Diagram canvas and control buttons render.
  - Clicking the Causal Discover action does not crash the page. The visible UI
    did not provide a strong result-complete signal in this run.
- Data Copilot filter popover was retested:
  - `+ Add Filter` opens the Field popover.
  - RathSelect renders all Cars fields, including `Origin`.
  - Submitting `Origin` from the current Data Copilot state did not create a
    verifiable filter table. This was superseded by the later DataSource
    fieldFilter test below, which exercises the actual set-selection
    multi-select path and verifies submit/reset row-count changes.
- Browser console during the Causal run reported GraphicWalker/third-party React
  warnings (`defaultProps`, `fill-rule`, `clip-rule`). No Fluent/Fabric missing
  asset or migration-specific runtime error was observed in that run.

Follow-up audit:

- The remaining lower-case Fabric class references were removed:
  - `packages/rath-client/src/pages/dataSource/metaView/metaList.tsx` no longer
    uses `ms-depth-4`.
  - `packages/rath-client/src/pages/semiAutomation/predictZone/index.tsx` no
    longer uses `ms-fontSize-18`.
- `scripts/ui-migration-gates.sh` and `scripts/audit-fluent-teardown.mjs` now
  catch lower-case `ms-*` Fabric classes as well as uppercase Fabric classes,
  while excluding legitimate `-ms-` CSS prefixes and Excel MIME strings.
- DataSource fieldFilter was retested through the actual field card path:
  - Meta tab renders per-field `Filter` buttons.
  - Opening the `Name` field filter shows the set-selection RathDataTable with
    `Select all` and per-row `Select row` checkboxes.
  - Selecting two rows changes the header checkbox to `indeterminate`.
  - Submitting the filter closes the popover and changes the dataset summary
    from `Select: 9 columns x 406 rows` to `Select: 9 columns x 3 rows`.
  - Reopening the filter exposes the `Reset` action, and reset restores
    `Select: 9 columns x 406 rows`.
- Causal Params was retested with a role locator:
  - The Params button opens the shadcn Sheet.
  - Algorithm options initialize to `PC: PC Algorithm`.
  - Dynamic params render, and the `Run` button is reachable.
  - Running from the Sheet closes it without crashing.
- Causal discovery completion was retested with a stronger visible result
  signal:
  - Cars data was loaded from the history card and Causal was opened with
    `Alt+C`.
  - The Causal wizard advanced to `Causal Model`; the Causal Discover action
    was unique by role locator and ran without toast errors.
- After the run, changing `View Type` from `Diagram` to `Matrix` exposed
  `Mark Type`, `Type of Link`, and a rendered 766 x 590 matrix canvas.
  - This is stronger evidence than diagram canvas hash comparison because
    `MatrixPanel` only renders `DirectionMatrix` for causal discovery when
    `causalityRaw` exists and matches the selected field count.

### Final regression hardening

- Shared `RathDataTable` behavior was aligned with the former `DetailsList`:
  - Headers and cells are single-line by default and truncate with ellipsis.
  - Declared column widths include the table cell padding used by the new
    implementation, and tables scroll horizontally instead of shrinking below
    their configured minimum widths.
  - Bounded tables use windowed rendering above their configured threshold,
    keep the header sticky, and accept stable row keys.
- Browser checks covered the reported DatasetPanel and Predict regressions:
  - Students long field names render on one line without unwanted wrapping.
  - Predict `Features` and `Targets` headers stay on one line and ellipsize.
  - A 44-field Kepler dataset rendered only the visible table rows while
    retaining the full scroll range.
- Final verification passed:
  - `scripts/ui-migration-gates.sh`
  - `node scripts/audit-fluent-teardown.mjs --strict`
  - `node scripts/verify-icon-map.mjs`
  - TypeScript, 47 client tests, and the production client build
