import { test, expect } from '@playwright/test';

test.describe('RATH smoke', () => {
    test('loads shell and navigates via hash router', async ({ page }) => {
        await page.goto('/#/connection');

        await expect(page.locator('.main-app-container')).toBeVisible({ timeout: 60_000 });

        await page.locator('.main-app-nav a').filter({ hasText: /Data Source|数据源/ }).first().click();

        await expect(page).toHaveURL(/#\/dataSource/);
    });

    test('supports legacy hash without slash', async ({ page }) => {
        await page.goto('/#/megaAuto');

        await expect(page.locator('.main-app-container')).toBeVisible({ timeout: 60_000 });
        await expect(page).toHaveURL(/#\/megaAuto/);
    });
});
