# Rath shadcn Stage 4 Callsite Audit

This document records the icon migration callsite split after `RathIcon` and `legacy-map.ts` were introduced.

The `docs/shadcn-icon-mapping-review.md` mapping has been reviewed and Stage 4 runtime replacements have been applied. Fluent v8 standalone `<Icon>` callsites, the database `registerIcons(...)` side effect, and the bare `ms-Icon` nav toggle are now removed. `iconProps` usages remain deferred to Stage 5-7 with their owning Fluent components.

## Current Buckets

| Bucket | Scope | Stage 4 outcome |
|---|---|---|
| Standalone `<Icon iconName="...">` | Direct icon render with literal/conditional MDL2 names | Replaced with `RathIcon`. |
| Dynamic file icons | `getFileIcon(...)` from `utils/fileIconMapper.ts` | Replaced with `FileTypeIcon`, keeping file-type aliases out of the reviewed MDL2 map. |
| Database brand icons | `registerIcons(...)` in the database connector | Replaced global Fluent icon registration with `DatabaseBrandIcon`; existing `/assets/icons/*` files are used directly. |
| Bare `ms-Icon` classes | `components/userSettings.tsx` nav toggle | Replaced with `RathIcon`. |
| `iconProps` on Fluent buttons/menus/inputs | `IconButton`, `ActionButton`, `DefaultButton`, `PrimaryButton`, `TextField`, `SearchBox`, menu item data | Defer to Stage 5-7 component migration unless the owner component is already being rewritten. |

## Direct Standalone Icon Candidates

These are the safest candidates for `RathIcon` once the mapping table is approved:

| Area | File | Notes |
|---|---|---|
| Shared error UI | `packages/rath-client/src/components/error/message.tsx` | `Cancel`, status icons `ErrorBadge` / `Blocked2` / `Completed` / `Info`. |
| Shared pagination | `packages/rath-client/src/components/pagination/index.tsx` | Uses `CaretSolidDown` / `CaretSolidUp`. |
| Field placeholder | `packages/rath-client/src/components/fieldPill/fieldPlaceholder.tsx` | `SearchIssue`; keep ContextualMenu/SearchBox migration separate. |
| Label tooltip | `packages/rath-client/src/components/labelTooltip.tsx` | One inline `Info`; `IconButton` in same file is deferred. |
| Login settings | `packages/rath-client/src/pages/loginInfo/index.tsx` | Standalone nav/settings icon plus Nav component still deferred. |
| Mega automation pagination | `packages/rath-client/src/pages/megaAutomation/vizPagination.tsx` | `ChevronLeft` / `ChevronRight`; SearchBox deferred. |
| Mega automation field pill | `packages/rath-client/src/pages/megaAutomation/vizOperation/viewField.tsx` | `Cancel`; local styling should remain intact. |
| Dashboard renderer | `packages/rath-client/src/pages/dashboard/renderer/components/move-handler.tsx` | `Move`; surrounding drag behavior must be smoke-tested. |
| Data source import storage | `packages/rath-client/src/pages/dataSource/importStorage/index.tsx` | `CloudDownload`, lowercase `delete`; DetailsList/Modal/Pivot deferred. |
| Data/file import upload | `packages/rath-client/src/pages/dataSource/selection/file/file-upload.tsx` and `packages/rath-client/src/pages/dataConnection/file/file-upload.tsx` | Literal `Upload` can use `RathIcon`; `getFileIcon(preview.name)` is dynamic and separate. |
| Demo/history file cards | data source and data connection demo/history files | Dynamic `getFileIcon(...)`; keep separate. |
| Causal explainer | `visText.tsx`, `RInsightView.tsx` | `Tag`, `BulletedList`, `Link`; buttons/toggles deferred. |
| Causal panels | `directionMatrix.tsx`, `explorer/index.tsx`, `step/index.tsx` | Literal/conditional icons `Help`, `Waffle`, `Info`/`InfoSolid`; larger Fluent components deferred. |
| Prediction panel | `predictPanel/index.tsx`, `predictPanel/resultPanel.tsx` | `Play` and result status icons; Spinner/DetailsList deferred. |
| Database tree/form | database form and nested-list components | Literal/conditional icons `Database`, `TableGroup`, `Table`, `ProductList`, `Document`, status icons; dropdown/buttons deferred. |

## Database Brand Icon Plan

The current database connector registers one Fluent icon per database option:

- Source: `packages/rath-client/src/pages/dataConnection/database/main.tsx`
- Data: `packages/rath-client/src/pages/dataConnection/database/options.ts`
- Assets: `packages/rath-client/public/assets/icons/*`
- New base component: `packages/rath-client/src/components/icons/custom/database-brand-icon.tsx`

After approval, remove the `registerIcons(...)` side effect and render database option imagery through `DatabaseBrandIcon`. Keep `Demo` iconless unless product/design asks for a fallback.

## Defer List

Do not fold these into the first Stage 4 replacement patch:

- `iconProps` in Fluent `IconButton`, `ActionButton`, `DefaultButton`, `PrimaryButton`, `CommandBarButton`.
- `SearchBox` and `TextField` icon props.
- `Dropdown`/`ContextualMenu` option objects containing `iconProps`.
- `DetailsList`, `Pivot`, `Nav`, `Panel`, `Modal`, `Dialog`, `HoverCard`, `TooltipHost`, and `Callout` owners.
- File type icons returned by `getFileIcon(...)`.

Those callsites are coupled to component API migration and should be handled in Stage 5-7 with the owning component.

## Validation Commands

Run these before and after any Stage 4 replacement patch:

```bash
scripts/verify-icon-map.mjs
scripts/audit-icon-calls.mjs
scripts/ui-migration-gates.sh
yarn workspace rath-client build
```

`scripts/audit-icon-calls.mjs` is intentionally report-oriented for dynamic expressions. It fails only when a literal `iconName` is missing from `legacy-map.ts`; dynamic expressions are listed for reviewer attention because they can contain non-icon strings. Known non-icon sentinels such as the pagination item type `previous` are reported under `ignoredExpressionLiteralNames` instead of `unmappedExpressionLiteralNames`.
