# Fluent UI CDN Fix

## Problem
The application was experiencing CORS errors when trying to load Fluent UI icons from Microsoft's CDN:

```
Access to font at 'https://spoppe-b.azureedge.net/files/fabric-cdn-prod_20210407.001/assets/icons/fabric-icons-7-2b97bb99.woff' from origin 'https://rath.kanaries.net' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
Microsoft has deprecated CDN support for Fluent UI icons (formerly Office UI Fabric). The CDN endpoints no longer provide proper CORS headers, causing the font loading to fail.

## Solution Applied

### 1. Updated Icon Initialization
Modified the following files to use local/npm-based icons instead of the deprecated CDN:

- `packages/rath-client/src/index.tsx`: Updated `initializeIcons()` call
- `packages/rath-client/src/pages/dataConnection/history/get-file-icon.tsx`: Updated `initializeFileTypeIcons()` call  
- `packages/rath-client/src/pages/dataSource/selection/history/get-file-icon.tsx`: Updated `initializeFileTypeIcons()` call

### 2. Changes Made

#### Before:
```typescript
initializeIcons(); // Uses deprecated Microsoft CDN
initializeFileTypeIcons(); // Uses deprecated Microsoft CDN
```

#### After:
```typescript
initializeIcons(/* baseUrl */ undefined, { disableWarnings: true }); // Uses local/npm-based icons
initializeFileTypeIcons(/* baseUrl */ undefined); // Uses local/npm-based icons
```

### 3. Deprecated CSS Import
Commented out the deprecated `office-ui-fabric-core` CSS import in `packages/rath-client/src/index.tsx`:

```typescript
// import 'office-ui-fabric-core/dist/css/fabric.css'; // Deprecated - commenting out to avoid CDN issues
```

## How This Works
By passing `undefined` as the `baseUrl` parameter to the icon initialization functions, Fluent UI will:
1. Use the icons that are bundled with the npm packages instead of trying to load from external CDNs
2. Avoid CORS issues since no external requests are made
3. Ensure icons continue to work reliably

## Alternative Solutions (for future consideration)

### Option 1: Migrate to Modern Fluent UI Icons
Consider migrating to the newer `@fluentui/react-icons` package which uses SVG icons instead of fonts:

```typescript
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';
```

### Option 2: Host Icons Locally
If font icons are preferred, the icon fonts can be hosted locally and referenced with a custom baseUrl.

### Option 3: Use a Different CDN
A custom CDN with proper CORS headers could be used, though this requires hosting the icon files.

## Testing
After applying these changes:
1. Clear browser cache
2. Reload the application
3. Verify that icons load correctly without CORS errors
4. Check browser developer tools network tab to confirm no failed icon font requests

## Dependencies Affected
- `@fluentui/font-icons-mdl2` - Main icon font package
- `@fluentui/react-file-type-icons` - File type specific icons
- `office-ui-fabric-core` - Deprecated package (CSS import commented out)

## References
- [GitHub Issue: Icons no longer load from MS CDNs](https://github.com/microsoft/fluentui/issues/32861)
- [Fluent UI Migration Guide](https://github.com/microsoft/fluentui/blob/master/docs/React/guides/migration-guide.md)