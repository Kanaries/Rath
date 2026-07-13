import { expect, test, type Page } from '@playwright/test';

async function loadCars(page: Page) {
    await page.route('**/_vercel/insights/script.js', (route) =>
        route.fulfill({ status: 204, contentType: 'text/javascript', body: '' })
    );
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Create DataSource/i }).click();
    await page.getByText('Demo', { exact: true }).click();
    await page.getByRole('gridcell', { name: /^Cars\b/ }).click();
    await expect(page.getByText(/9 columns × 406 rows/)).toBeVisible();
}

test('every lazy page renders on its first visit', async ({ page }) => {
    const pageErrors: string[] = [];
    const failedLocalRequests: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
        if (new URL(request.url()).origin === 'http://127.0.0.1:4173') {
            failedLocalRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
        }
    });

    await loadCars(page);

    await page.getByRole('button', { name: 'Data Copilot', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Associated Patterns' })).toBeVisible();

    await page.getByRole('button', { name: 'Exploration', exact: true }).click();
    await expect(page.locator('[data-rbd-drag-handle-draggable-id]').first()).toBeVisible();
    await expect(page.getByText('Preparing Exploration...', { exact: true })).toBeHidden();

    await page.getByRole('button', { name: 'Data Painter', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No visualization selected' })).toBeVisible();

    await page.getByRole('button', { name: 'Collection', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No saved views yet' })).toBeVisible();

    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByRole('button', { name: 'New Dashboard' })).toBeVisible();

    await page.getByRole('button', { name: 'Causal', exact: true }).click();
    await expect(page.getByText('Configure Dataset', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Insiders(α)', exact: true }).click();
    await page.getByRole('button', { name: 'Dashboard Designer', exact: true }).click();
    await expect.poll(() => page.locator('main canvas').count()).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Data Connections', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create DataSource' })).toBeVisible();

    await page.getByRole('button', { name: 'DataSource', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Start Analysis' })).toBeVisible();
    await page.getByRole('button', { name: 'Start Analysis' }).click();
    await expect(page.getByRole('button', { name: 'Re-Run Task' })).toBeVisible();
    await expect(page.getByText('36', { exact: true })).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
});

test('a failed lazy chunk keeps navigation available and offers recovery', async ({ page }) => {
    await page.route('**/assets/collection-*.js', (route) => route.abort());
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Collection', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Unable to load this page');
    await expect(page.getByRole('button', { name: 'Data Connections', exact: true })).toBeVisible();

    await page.unroute('**/assets/collection-*.js');
    await page.getByRole('button', { name: 'Reload Rath' }).click();
    await expect(page.getByRole('button', { name: 'Create DataSource' })).toBeVisible();
});
