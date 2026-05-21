import { test, expect } from '@playwright/test';

test.describe('RATH smoke', () => {
    test('loads shell and navigates via hash router', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText('Initializing Rath...')).toBeHidden({ timeout: 30_000 });

        await expect(page.locator('.main-app-container')).toBeVisible();

        await page.locator('.main-app-nav a').filter({ hasText: /Data Source|数据源/ }).first().click();

        await expect(page).toHaveURL(/#\/dataSource/);
    });

    test('supports legacy hash without slash', async ({ page }) => {
        await page.goto('/#/megaAuto');

        await expect(page.getByText('Initializing Rath...')).toBeHidden({ timeout: 30_000 });

        await expect(page).toHaveURL(/#\/megaAuto/);
    });
});
