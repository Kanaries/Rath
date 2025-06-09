# FluentUI v8 to v9 Migration Status

*Last updated: December 2024*

## Overview

This document tracks the migration status from FluentUI v8 (`@fluentui/react`) to v9 (`@fluentui/react-components`) for the RATH project.

**Current Versions:**
- `@fluentui/react`: ^8.123.0 (v8)
- `@fluentui/react-components`: ^9.64.1 (v9)

## Migration Status Summary

| Status | Count | Description |
|--------|-------|-------------|
| ✅ Migrated | 8 | Already using v9 components |
| 🟢 Ready to Migrate | 25 | v9 equivalent available |
| 🟡 Partial Support | 7 | Limited v9 support, may need workarounds |
| 🔴 No v9 Equivalent | 12 | Staying with v8 for now |
| **Total Components** | **52** | **Unique v8 components in use** |

## Components Currently Using v9

These components have already been migrated:

| Component | v9 Package | Usage |
|-----------|------------|-------|
| `Button` | `@fluentui/react-components` | dataConnection/create.tsx, dataConnection/index.tsx |
| `Card` | `@fluentui/react-components` | dataConnection/create.tsx, supportedSources.tsx |
| `CardHeader` | `@fluentui/react-components` | history-list-item.tsx, demo.tsx |
| `Text` | `@fluentui/react-components` | supportedSources.tsx, demo.tsx |
| `Caption1` | `@fluentui/react-components` | Multiple files |
| `Tab` | `@fluentui/react-components` | dataSource/index.tsx |
| `TabList` | `@fluentui/react-components` | dataSource/index.tsx |
| `Menu*` | `@fluentui/react-components` | baseActions/mainActionButton.tsx |

## Ready to Migrate (v9 Available)

These v8 components have direct v9 equivalents and can be migrated:

### High Priority (Frequently Used)

| v8 Component | v9 Equivalent | Files Using | Migration Notes |
|--------------|---------------|-------------|-----------------|
| `TextField` | `Input` / `Field` | 20+ files | Use `Field` wrapper for labels |
| `DefaultButton` / `PrimaryButton` | `Button` | 30+ files | Use `appearance` prop |
| `Dropdown` | `Dropdown` | 25+ files | Similar API, some prop changes |
| `Stack` | Native CSS / `makeStyles` | 20+ files | Use CSS flexbox instead |
| `Icon` | `@fluentui/react-icons` | 15+ files | Import specific icons |
| `Toggle` | `Switch` | 10+ files | Similar functionality |
| `Checkbox` | `Checkbox` | 8+ files | Direct replacement |
| `Slider` | `Slider` | 5+ files | Direct replacement |
| `Spinner` | `Spinner` | 15+ files | Direct replacement |

### Medium Priority

| v8 Component | v9 Equivalent | Files Using | Migration Notes |
|--------------|---------------|-------------|-----------------|
| `Modal` | `Dialog` | 8 files | Props structure changed |
| `Panel` | `Drawer` | 6 files | Similar functionality |
| `ChoiceGroup` | `RadioGroup` | 6 files | Direct replacement |
| `SpinButton` | `SpinButton` | 3 files | Direct replacement |
| `Pivot` / `PivotItem` | `TabList` / `Tab` | 8 files | Already started migration |
| `SearchBox` | `SearchBox` | 3 files | Direct replacement |
| `ProgressIndicator` | `ProgressBar` | 5 files | Direct replacement |
| `MessageBar` | `MessageBar` | 4 files | Direct replacement |
| `Breadcrumb` | `Breadcrumb` | 2 files | Direct replacement |
| `IconButton` | `Button` | 10+ files | Use `appearance="subtle"` |
| `ActionButton` | `Button` | 8 files | Use `appearance="subtle"` |
| `CommandButton` | `Button` | 6 files | Use `appearance="subtle"` |

### Low Priority

| v8 Component | v9 Equivalent | Files Using | Migration Notes |
|--------------|---------------|-------------|-----------------|
| `Label` | `Label` / `Field` | 8 files | Use with Field component |
| `Separator` | `Divider` | 2 files | Direct replacement |
| `TooltipHost` | `Tooltip` | 4 files | API simplified |
| `Dialog` | `Dialog` | 2 files | Already available in v9 |
| `Callout` | `Popover` | 2 files | Similar functionality |

## Partial Support in v9

These components have limited or different v9 implementations:

| v8 Component | v9 Status | Files Using | Notes |
|--------------|-----------|-------------|-------|
| `DetailsList` | `DataGrid` (preview) | 6 files | Different API, preview status |
| `Nav` | Limited support | 2 files | Use custom navigation or keep v8 |
| `CommandBar` | No direct equivalent | 2 files | Use `Toolbar` or custom solution |
| `ContextualMenu` | `Menu` (partial) | 3 files | Some features missing |
| `ColorPicker` | No v9 yet | 1 file | Keep v8 for now |
| `HoverCard` | No direct equivalent | 1 file | Use `Popover` with hover trigger |
| `Shimmer` | `Skeleton` | 2 files | Different API |

## No v9 Equivalent (Keep v8)

These components don't have v9 equivalents and should remain on v8:

| v8 Component | Files Using | Status | Recommendation |
|--------------|-------------|--------|----------------|
| `Selection` / `SelectionMode` | 4 files | No v9 | Keep v8 |
| `IColumn` | 3 files | No v9 | Keep v8 |
| `Theme` / `createTheme` | 2 files | Different approach | Use v9 theming system |
| `DirectionalHint` | 1 file | No v9 | Keep v8 |
| `DetailsListLayoutMode` | 1 file | No v9 | Keep v8 |
| `registerIcons` | 1 file | No v9 | Keep v8 |
| `useTheme` | 1 file | Different approach | Use v9 tokens |
| `INavLinkGroup` | 1 file | No v9 | Keep v8 |
| `IBreadcrumbItem` | 1 file | Different API | Keep v8 or refactor |
| `IDropdownOption` | Multiple files | Different API | Refactor when migrating Dropdown |
| `IContextualMenuItem` | 2 files | Different API | Refactor when migrating menus |
| `ICommandBarItemProps` | 1 file | No v9 | Keep v8 |

## Migration Recommendations

### Phase 1: Low-Risk Migrations (Immediate)
1. **Icons**: Migrate from `Icon` to specific icons from `@fluentui/react-icons`
2. **Simple Buttons**: Replace `DefaultButton`/`PrimaryButton` with `Button`
3. **Basic Inputs**: Replace `TextField` with `Input` + `Field`
4. **Toggles**: Replace `Toggle` with `Switch`

### Phase 2: Medium-Risk Migrations (Next Sprint)
1. **Dropdowns**: Migrate `Dropdown` components (test thoroughly)
2. **Modals**: Replace `Modal` with `Dialog`
3. **Progress**: Replace `ProgressIndicator` with `ProgressBar`
4. **Spinners**: Direct replacement

### Phase 3: Complex Migrations (Future)
1. **Data Tables**: Evaluate `DetailsList` → `DataGrid` migration
2. **Navigation**: Custom solution or keep v8
3. **Command Bars**: Custom solution or keep v8
4. **Theme System**: Migrate to v9 theming

## Implementation Notes

### Import Changes
```typescript
// v8
import { DefaultButton, TextField, Icon } from '@fluentui/react';

// v9
import { Button, Input, Field } from '@fluentui/react-components';
import { Search20Regular } from '@fluentui/react-icons';
```

### Common Prop Mapping
```typescript
// Button
// v8: <DefaultButton primary text="Save" />
// v9: <Button appearance="primary">Save</Button>

// Input
// v8: <TextField label="Name" value={value} onChange={onChange} />
// v9: <Field label="Name"><Input value={value} onChange={onChange} /></Field>

// Toggle → Switch
// v8: <Toggle checked={checked} onChange={onChange} />
// v9: <Switch checked={checked} onChange={onChange} />
```

### Bundle Size Impact
- v9 components are generally smaller and more performant
- Tree-shaking works better with v9
- Consider using migration shims during transition: `@fluentui/react-migration-v8-v9`

## Next Steps

1. **Immediate**: Start with Phase 1 migrations (low-risk)
2. **Install migration package**: `npm install @fluentui/react-migration-v8-v9` for gradual migration
3. **Update theme system**: Migrate from v8 theming to v9 tokens
4. **Test thoroughly**: Each migration should include comprehensive testing
5. **Monitor bundle size**: Track changes during migration

## Resources

- [FluentUI v9 Component Gallery](https://react.fluentui.dev/)
- [Migration Guide](https://react.fluentui.dev/?path=/docs/concepts-migration-from-v8-component-mapping--docs)
- [v9 Design Tokens](https://react.fluentui.dev/?path=/docs/theme-design-tokens--docs)
- [Migration Shims](https://www.npmjs.com/package/@fluentui/react-migration-v8-v9)

---

*This document will be updated as new v9 components become available and migration progress is made.*