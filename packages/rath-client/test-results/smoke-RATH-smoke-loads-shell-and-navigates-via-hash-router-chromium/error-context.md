# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> RATH smoke >> loads shell and navigates via hash router
- Location: e2e/smoke.spec.ts:4:9

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.main-app-container')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for locator('.main-app-container')

```

```yaml
- iframe
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('RATH smoke', () => {
  4  |     test('loads shell and navigates via hash router', async ({ page }) => {
  5  |         await page.goto('/#/connection');
  6  | 
> 7  |         await expect(page.locator('.main-app-container')).toBeVisible({ timeout: 60_000 });
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  8  | 
  9  |         await page.locator('.main-app-nav a').filter({ hasText: /Data Source|数据源/ }).first().click();
  10 | 
  11 |         await expect(page).toHaveURL(/#\/dataSource/);
  12 |     });
  13 | 
  14 |     test('supports legacy hash without slash', async ({ page }) => {
  15 |         await page.goto('/#/megaAuto');
  16 | 
  17 |         await expect(page.locator('.main-app-container')).toBeVisible({ timeout: 60_000 });
  18 |         await expect(page).toHaveURL(/#\/megaAuto/);
  19 |     });
  20 | });
  21 | 
```