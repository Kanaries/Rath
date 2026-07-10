# Rath Fluent UI to shadcn Migration Plan

> **SUPERSEDED**: This document has been replaced by [`shadcn-migration-execution.md`](./shadcn-migration-execution.md), which contains the authoritative staging, toolchain decisions, scope boundaries, and pre-migration prerequisites (Insider backflow, de-accountization, React 18). Use this file only as supplementary reference for the component decision matrix. When the two documents conflict, the execution document wins.

This document is an agent-facing architecture analysis and migration checklist for moving Rath's frontend UI from Fluent UI/Fabric UI to shadcn-based components.

The goal is not to run Fluent UI v8, Fluent UI v9, and shadcn together in production. Temporary coexistence is acceptable only inside migration branches. The final shipping state must remove Fluent/Fabric dependencies and providers.

## Current UI Architecture

Rath currently mixes multiple generations of Microsoft's UI stack:

- `@fluentui/react` v8: the dominant component source.
- `@fluentui/react-components` v9: used in a small number of newer surfaces.
- `@fluentui/react-hooks`: mainly `useId` and `useBoolean`.
- `@fluentui/font-icons-mdl2`: MDL2 icon font initialized at app startup.
- `office-ui-fabric-core`: global Fabric CSS.
- `styled-components`: heavily used for local layout and styling.

The app entry currently nests both v8 and v9 providers:

- v8 `ThemeProvider`
- v9 `FluentProvider`
- Fabric core CSS import
- local MDL2 icon font initialization

This means the migration is not a simple import replacement. It is a UI boundary rebuild:

- Replace Fluent providers with a shadcn/Tailwind token layer.
- Replace MDL2 icon strings with a Rath-owned icon abstraction.
- Replace high-level Fluent components with Rath-owned wrappers where direct shadcn equivalents are insufficient.
- Directly migrate low-risk foundational controls where preserving old Fluent APIs would create unnecessary long-term weight.

## Final Acceptance Checklist

These checks must pass before the migration can be considered complete.

### Dependency Removal

- [ ] Remove `@fluentui/react` from `packages/rath-client/package.json`.
- [ ] Remove `@fluentui/react-components` from `packages/rath-client/package.json`.
- [ ] Remove `@fluentui/react-hooks` from `packages/rath-client/package.json`.
- [ ] Remove `@fluentui/font-icons-mdl2` from `packages/rath-client/package.json`.
- [ ] Remove `@fluentui/react-file-type-icons` if still present.
- [ ] Remove `office-ui-fabric-core`.
- [ ] Remove unused Fluent/Fabric font assets from `packages/rath-client/public/fonts`.
- [ ] Remove Fluent-related lockfile entries after dependency update.

### Import Gates

Run these checks from the Rath repo root:

```bash
rg "@fluentui/react|@fluentui/react-components|@fluentui/react-hooks|@fluentui/font-icons-mdl2|@fluentui/react-file-type-icons|office-ui-fabric-core" packages/rath-client/src packages/rath-client/package.json
```

Expected result:

- [ ] No app source imports from Fluent/Fabric packages.
- [ ] No `office-ui-fabric-core/dist/css/fabric.css` import.
- [ ] No `initializeIcons(...)` call.
- [ ] No `ThemeProvider` from `@fluentui/react`.
- [ ] No `FluentProvider` from `@fluentui/react-components`.

### Icon Gates

```bash
rg "iconName=|iconProps=|registerIcons|initializeIcons|ms-Icon" packages/rath-client/src
```

Expected result:

- [ ] No Fluent `iconName` string usage in app code.
- [ ] No Fluent `iconProps` button usage.
- [ ] No `registerIcons`.
- [ ] No MDL2 icon font dependency.
- [ ] All legacy icon names are mapped through a Rath-owned icon component or replaced with direct `lucide-react` icons.

### Styling Gates

```bash
rg "\\bms-[A-Za-z0-9-]+\\b" packages/rath-client/src packages/rath-client/public
```

Expected result:

- [ ] No Fabric `ms-*` class dependencies remain.
- [ ] Global Fabric CSS has been removed.
- [ ] Foundational colors, spacing, radius, border, focus, and typography use the new token layer.

### Runtime Verification

- [ ] App builds successfully.
- [ ] App starts successfully in local development.
- [ ] No missing component runtime errors.
- [ ] No missing icon/font errors.
- [ ] No broken keyboard navigation in menus, dialogs, panels, tabs, and tables.
- [ ] Main data workflows still work: import data, preview data, analyze, dashboard, causal analysis, painter.
- [ ] Visual regression review completed for major pages.

## Migration Architecture

Recommended target structure:

```txt
packages/rath-client/src/components/ui/
  shadcn source components and low-level primitives

packages/rath-client/src/components/rath-ui/
  Rath-owned composed components and compatibility wrappers

packages/rath-client/src/components/icons/
  RathIcon and legacy MDL2-to-lucide/custom icon mapping

packages/rath-client/src/styles/
  app tokens, Tailwind entry CSS, theme bridge if needed
```

Use this split to keep shadcn primitives clean while allowing Rath-specific behavior to live in a deliberate layer.

### Component Strategy Rules

- Use direct shadcn migration for simple foundational controls.
- Use Rath-owned components for repeated product patterns that should not expose Fluent APIs.
- Use compatibility wrappers only for complex/high-risk Fluent components where rewriting every call site at once would be risky.
- Do not preserve Fluent APIs for every component. Preserve only the APIs that reduce migration risk.
- Do not let app code import Radix primitives directly unless the pattern is intentionally low-level.
- Do not introduce new Fluent usage during migration.

## Components That Should Be Componentized

These components should be implemented as Rath-owned components before broad call-site migration.

### RathIcon

Purpose:

- Replace MDL2 `Icon`, `iconName`, `iconProps`, `initializeIcons`, and icon fonts.
- Centralize legacy icon name mapping.
- Allow gradual call-site conversion without losing visual intent.

Target:

```tsx
<RathIcon name="Delete" />
<RathIcon name="CloudDownload" />
```

Implementation notes:

- Map common legacy names to `lucide-react`.
- Use local custom SVGs only for icons without acceptable lucide equivalents.
- Keep the legacy-name map explicit and typed.
- Add a fallback icon for unmapped names during migration, but fail or warn in CI before release.

Checklist:

- [ ] Create `RathIcon`.
- [ ] Create legacy icon name map.
- [ ] Replace all `<Icon iconName="..." />`.
- [ ] Replace all `iconProps={{ iconName: "..." }}`.
- [ ] Replace `registerIcons`.
- [ ] Remove `initializeIcons('/fonts/')`.

### RathButton / IconButton Pattern

Purpose:

- Unify repeated button variants and icon-only buttons.
- Avoid preserving the entire Fluent button API.

Use componentization for:

- Icon-only action buttons.
- Toolbar buttons.
- Buttons with loading state.
- Buttons with destructive styling.

Do not preserve:

- Generic `iconProps`.
- Fluent-specific `styles`.
- Fluent menu integration.

Checklist:

- [ ] Define standard variants: primary, secondary/outline, ghost, destructive, link.
- [ ] Define standard sizes: default, sm, icon.
- [ ] Replace simple `DefaultButton` and `PrimaryButton` directly where practical.
- [ ] Use `RathIconButton` only when icon-only semantics repeat.

### RathSelect

Purpose:

- Replace high-volume Fluent `Dropdown` usage that depends on `options`, `selectedKey`, and `IDropdownOption`.
- Avoid repeating shadcn `Select` boilerplate at every call site.

Suggested API:

```tsx
<RathSelect
  options={[{ key: "csv", text: "CSV" }]}
  selectedKey={value}
  onChange={(key, option) => setValue(key)}
/>
```

Implementation notes:

- Support single select first.
- Add multi-select only where current Fluent usage requires it.
- Preserve `key/text/disabled` option shape for migration convenience.
- For searchable selects, use a separate `RathCombobox`.

Checklist:

- [ ] Inventory all `Dropdown` props in use.
- [ ] Implement single-select wrapper.
- [ ] Implement searchable combobox only for call sites that need search.
- [ ] Implement option rendering extension only where currently used.
- [ ] Replace `IDropdownOption` imports with Rath types.

### RathDataTable

Purpose:

- Replace Fluent `DetailsList`, `DetailsRow`, `IColumn`, `Selection`, and `SelectionMode`.
- Provide a stable Rath table abstraction over shadcn `Table` and TanStack Table.

This is a high-risk component. Treat it as a first-class migration project.

Required capabilities:

- Column definitions.
- Custom header rendering.
- Custom cell rendering.
- Row actions.
- Empty state.
- Basic sorting where currently used.
- Single, multiple, and none selection where currently used.
- Controlled selection.
- Compact density.
- Horizontal overflow.

Suggested migration compatibility:

- Support a temporary adapter from a subset of Fluent `IColumn` to Rath column definitions.
- Do not attempt to fully emulate every `DetailsList` behavior.

Checklist:

- [ ] Inventory every `DetailsList` call site.
- [ ] Classify each table by simple display, selectable list, sortable list, or custom row render.
- [ ] Build `RathDataTable`.
- [ ] Build `IColumn` adapter only for needed fields.
- [ ] Replace `Selection` state with React/TanStack state.
- [ ] Verify row keyboard and click behavior.

### RathDialog / ConfirmDialog

Purpose:

- Replace `Modal`, `Dialog`, and `DialogFooter`.
- Standardize dialog layout and destructive confirmations.

Use shadcn:

- `Dialog` for regular modal workflows.
- `AlertDialog` for destructive confirmation.

Checklist:

- [ ] Create `RathDialog` for repeated modal layout.
- [ ] Create `ConfirmDialog` for destructive flows.
- [ ] Replace `DialogFooter` with explicit footer slot.
- [ ] Replace `isOpen/onDismiss` with `open/onOpenChange` or adapter props.

### RathPanel

Purpose:

- Replace Fluent `Panel` with shadcn `Sheet` or `Drawer`.
- Preserve only useful application-level semantics.

Suggested API:

```tsx
<RathPanel open={open} onOpenChange={setOpen} title="Settings" side="right">
  ...
</RathPanel>
```

Checklist:

- [ ] Replace `PanelType` usage with Rath side/size props.
- [ ] Support footer actions if currently used.
- [ ] Verify focus trapping and escape behavior.

### ActionMenu / Toolbar / SplitActionButton

Purpose:

- Replace `ContextualMenu`, `IContextualMenuProps`, `CommandBar`, menu-enabled `IconButton`, and v9 `Menu/SplitButton`.
- Move from Fluent menu schemas to Rath action schemas.

Suggested action shape:

```ts
type RathAction = {
  key: string;
  label: string;
  icon?: RathIconName;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
  children?: RathAction[];
};
```

Checklist:

- [ ] Inventory all `menuProps` and `IContextualMenuProps` usage.
- [ ] Create `ActionMenu`.
- [ ] Create `Toolbar`.
- [ ] Create `SplitActionButton` for primary action + menu.
- [ ] Replace `CommandBar` items with Rath action schema.
- [ ] Replace nested menu items only where currently used.

### RathTabs

Purpose:

- Replace complex or repeated `Pivot/PivotItem` usage.
- Direct shadcn `Tabs` is enough for simple local tabs; use `RathTabs` only for repeated patterns.

Checklist:

- [ ] Directly migrate simple `Pivot` usages.
- [ ] Create `RathTabs` only if multiple call sites need the same controlled key/header/icon behavior.
- [ ] Replace `headersOnly` variants with tab-list-only rendering.

### RathNav / App Sidebar

Purpose:

- Replace Fluent `Nav` and `INavLinkGroup`.
- Keep app-level navigation separate from generic shadcn navigation primitives.

Checklist:

- [ ] Inventory `Nav` groups.
- [ ] Define Rath navigation item schema.
- [ ] Implement app sidebar/nav with active state.
- [ ] Replace `INavLinkGroup` imports.

### RathSearchInput

Purpose:

- Replace `SearchBox` and `TextField` usages with search icon behavior.

Checklist:

- [ ] Create reusable search input using shadcn `Input` and lucide search icon.
- [ ] Support `value`, `onChange`, and `onSearch` where needed.
- [ ] Replace `SearchBox`.

### RathMessage / Notification Pattern

Purpose:

- Replace `MessageBar`, `MessageBarButton`, and status messages.

Use:

- shadcn `Alert` for inline messages.
- `Sonner`/toast for transient notifications if needed.

Checklist:

- [ ] Create inline alert pattern.
- [ ] Map message variants: info, success, warning, error.
- [ ] Replace `MessageBarType`.

## Components That Can Be Directly Migrated

These should not keep Fluent APIs unless a specific call site proves risky.

### Buttons

Directly migrate:

- `PrimaryButton` to `Button`.
- `DefaultButton` to `Button variant="outline"` or appropriate variant.
- Simple `ActionButton` to `Button variant="ghost"` or `Button variant="link"`.

Checklist:

- [ ] Replace `text` prop with children.
- [ ] Replace `disabled`, `onClick` directly.
- [ ] Replace `iconProps` with `<RathIcon />` or lucide child.

### Text Inputs

Directly migrate:

- Simple `TextField` to `Input`.
- Multi-line `TextField` to `Textarea`.

Checklist:

- [ ] Replace Fluent `onChange={(e, value) => ...}` with native value handling.
- [ ] Replace `label` with `Label` + `Input`.
- [ ] Replace `errorMessage` with local field error text.

### Toggle / Checkbox / ChoiceGroup

Directly migrate:

- `Toggle` to `Switch`.
- `Checkbox` to `Checkbox`.
- `ChoiceGroup` to `RadioGroup` or `ToggleGroup`.

Checklist:

- [ ] Normalize boolean event signatures.
- [ ] Preserve accessible labels.
- [ ] Replace `selectedKey` with controlled value.

### Slider / Progress / Spinner / Skeleton

Directly migrate:

- `Slider` to `Slider`.
- `ProgressIndicator` to `Progress`.
- `Spinner` to shadcn `Spinner` or local spinner.
- `Shimmer` to `Skeleton`.

Checklist:

- [ ] Normalize value ranges.
- [ ] Verify loading layout does not shift unexpectedly.

### Label / Separator / Breadcrumb / Card / Text

Directly migrate:

- `Label` to shadcn `Label`.
- `Separator` to shadcn `Separator`.
- `Breadcrumb` to shadcn `Breadcrumb`.
- v9 `Card/CardHeader` to shadcn `Card`.
- v9 `Text/Caption1` to semantic text elements with Tailwind classes.

Checklist:

- [ ] Avoid preserving Fluent typography components.
- [ ] Use semantic HTML where possible.
- [ ] Use tokenized Tailwind classes.

### Tooltip / Hover Card / Popover

Mostly direct migration:

- `TooltipHost` to `Tooltip`.
- `HoverCard` to shadcn `HoverCard`.
- Simple `Callout` to `Popover`.

Use Rath wrappers only when positioning, target refs, or open state is complex.

Checklist:

- [ ] Verify keyboard/focus behavior.
- [ ] Replace `DirectionalHint` with side/align props.
- [ ] Avoid brittle DOM id targets where possible.

## Special-Risk Areas

### DetailsList and Selection

Risk:

- Fluent `DetailsList` carries table rendering, selection model, row rendering, focus behavior, and virtualization assumptions.

Guidance:

- Never replace all `DetailsList` usages with bare HTML tables.
- Build `RathDataTable` first.
- Migrate one representative table from each category before broad replacement.

### CommandBar and menuProps

Risk:

- Fluent action schemas are embedded in application logic.
- Menu-enabled buttons blur component and command modeling.

Guidance:

- Convert to Rath action schema.
- Keep command definitions close to feature logic.
- Keep rendering in `ActionMenu`, `Toolbar`, or `SplitActionButton`.

### Icon Names

Risk:

- Current app uses many MDL2 string names.
- Some names do not have one-to-one lucide equivalents.

Guidance:

- Build `RathIcon` and map names explicitly.
- Use custom SVGs sparingly.
- Prefer close semantic matches over pixel-perfect legacy icons.

### Stack and styled-components Layout

Risk:

- `Stack` is the most widely used Fluent layout primitive.
- The project also has many `styled-components` definitions.

Guidance:

- Replace simple `Stack` with flex/grid utility classes.
- Create a small `Stack`-like Rath layout helper only if it materially reduces churn.
- Do not blindly preserve all `Stack` props.
- Gradually move repeated layout patterns into Rath components or Tailwind utilities.

### Theme Tokens

Risk:

- Current v8 theme has palette and semantic colors.
- v9 theme has separate token names.
- shadcn uses CSS variables/Tailwind tokens.

Guidance:

- Define Rath tokens first: background, foreground, card, border, input, ring, primary, destructive, muted, accent.
- Map old palette intent to new variables.
- Remove Fluent providers only after equivalent app-level tokens exist.

## Agent Task Checklist

Use this as the primary task list for migration agents.

### Inventory

- [ ] Generate current Fluent component import inventory.
- [ ] Generate current Fluent icon name inventory.
- [ ] Generate current Fabric `ms-*` class inventory.
- [ ] Generate `DetailsList` call-site inventory.
- [ ] Generate `Dropdown` call-site inventory.
- [ ] Generate `menuProps` / `ContextualMenu` / `CommandBar` inventory.
- [ ] Identify mixed v8/v9 files.

### Foundation Setup

- [ ] Add Tailwind/shadcn setup compatible with the current React build.
- [ ] Add shadcn base components under `src/components/ui`.
- [ ] Add `cn` utility.
- [ ] Add Rath theme tokens.
- [ ] Add dark/light mode decision if needed.
- [ ] Verify build after setup.

### Rath UI Layer

- [ ] Implement `RathIcon`.
- [ ] Implement `RathSelect`.
- [ ] Implement `RathDataTable`.
- [ ] Implement `RathDialog` and `ConfirmDialog`.
- [ ] Implement `RathPanel`.
- [ ] Implement `ActionMenu`, `Toolbar`, and `SplitActionButton`.
- [ ] Implement `RathSearchInput`.
- [ ] Implement inline alert/message pattern.
- [ ] Implement `RathNav` if app navigation still depends on Fluent `Nav`.

### Direct Component Migration

- [ ] Replace simple buttons.
- [ ] Replace simple text inputs.
- [ ] Replace toggle/switch controls.
- [ ] Replace checkboxes.
- [ ] Replace radio/choice groups.
- [ ] Replace sliders.
- [ ] Replace progress indicators.
- [ ] Replace spinners and shimmers.
- [ ] Replace labels, separators, breadcrumbs, and simple cards.
- [ ] Replace simple tabs.
- [ ] Replace simple tooltips and popovers.

### Complex Component Migration

- [ ] Replace all `DetailsList` usage with `RathDataTable`.
- [ ] Replace all `Selection` and `SelectionMode` usage.
- [ ] Replace all `Dropdown` usage with `RathSelect`, `RathCombobox`, or direct shadcn `Select`.
- [ ] Replace all `ContextualMenu` usage.
- [ ] Replace all `CommandBar` usage.
- [ ] Replace all `Panel` usage.
- [ ] Replace all `Modal/Dialog` usage.
- [ ] Replace all `Nav` usage.
- [ ] Replace all `SearchBox` usage.

### Cleanup

- [ ] Remove Fluent providers from app root.
- [ ] Remove Fabric CSS import.
- [ ] Remove MDL2 icon initialization.
- [ ] Remove Fluent dependencies.
- [ ] Remove Fluent fonts.
- [ ] Remove Fluent type imports.
- [ ] Remove compatibility adapters that are no longer needed.
- [ ] Add CI/lint guard to block future Fluent imports.

### Verification

- [ ] Run typecheck/build.
- [ ] Run unit tests if available.
- [ ] Start app locally.
- [ ] Browser-verify main workflows.
- [ ] Check console for missing icons, hydration/render errors, and focus warnings.
- [ ] Review keyboard navigation in dialogs, sheets, menus, tabs, and tables.
- [ ] Review visual density and layout in data-heavy pages.
- [ ] Compare bundle size before and after removal.

## Migration Decision Matrix

Use this matrix for components not listed above.

Choose direct migration when:

- The component has a direct shadcn equivalent.
- The call site uses simple props.
- Preserving Fluent API would add more code than changing the call site.
- The component does not encode complex behavior or state.

Choose Rath componentization when:

- The pattern repeats across multiple pages.
- The component is product-specific rather than generic.
- The app needs a stable semantic API independent of shadcn internals.
- The component combines layout, icon, state, and actions.

Choose compatibility wrapper when:

- The Fluent component has many call sites.
- The Fluent API is deeply embedded in feature logic.
- Direct migration would require many risky simultaneous edits.
- The component has complex behavior such as selection, command schemas, or nested menus.

Avoid compatibility wrapper when:

- The component is a simple button/input/label.
- The wrapper would merely recreate Fluent's API with different internals.
- The old API would obscure the target design system.

## Definition of Done

The migration is done when:

- Rath's production bundle has no Fluent/Fabric dependencies.
- App code imports only shadcn/Rath UI components for migrated surfaces.
- Legacy MDL2 icon names are gone from app code or confined to an internal `RathIcon` compatibility map.
- All major workflows render and behave correctly.
- CI prevents reintroducing Fluent/Fabric imports.
- The resulting UI system has one ownership boundary: shadcn primitives plus Rath-owned composed components.
