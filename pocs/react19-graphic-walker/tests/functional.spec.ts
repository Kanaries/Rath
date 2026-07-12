import { expect, test } from '@playwright/test';

test('renders under React 19 and completes a mouse drag with a clean console', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const category = page.locator('[data-rbd-drag-handle-draggable-id="dimension_category"]');
    const columns = page.locator('[data-rbd-droppable-id="columns"]');
    await expect(category).toBeVisible();
    await expect(columns).toBeVisible();

    const sourceBox = await category.boundingBox();
    const targetBox = await columns.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2 + 10, sourceBox!.y + sourceBox!.height / 2, { steps: 5 });
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + 20, { steps: 20 });
    await page.mouse.up();

    await expect(columns).toContainText('Category');
    expect(consoleErrors).toEqual([]);
});

test('cancels a drag with escape without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const category = page.locator('[data-rbd-drag-handle-draggable-id="dimension_category"]');
    await expect(category).toBeVisible();
    const sourceBox = await category.boundingBox();
    expect(sourceBox).not.toBeNull();

    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2 + 40, sourceBox!.y + sourceBox!.height / 2, { steps: 10 });
    await page.keyboard.press('Escape');
    await page.mouse.up();

    // field stays on the shelf, nothing landed in columns
    const columns = page.locator('[data-rbd-droppable-id="columns"]');
    await expect(columns).not.toContainText('Category');
    expect(consoleErrors).toEqual([]);
});

test.describe('touch', () => {
    test.use({ hasTouch: true, viewport: { width: 900, height: 900 } });

    test('completes a long-press touch drag without console errors', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (message) => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });

        await page.goto('/', { waitUntil: 'networkidle' });

        const category = page.locator('[data-rbd-drag-handle-draggable-id="dimension_category"]');
        const columns = page.locator('[data-rbd-droppable-id="columns"]');
        await expect(category).toBeVisible();
        await expect(columns).toBeVisible();

        const sourceBox = await category.boundingBox();
        const targetBox = await columns.boundingBox();
        expect(sourceBox).not.toBeNull();
        expect(targetBox).not.toBeNull();

        const startX = sourceBox!.x + sourceBox!.width / 2;
        const startY = sourceBox!.y + sourceBox!.height / 2;
        const endX = targetBox!.x + targetBox!.width / 2;
        const endY = targetBox!.y + 20;

        // long-press lift (timeForLongPress is 120ms), then move, then release
        const client = await page.context().newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: startX, y: startY }],
        });
        await page.waitForTimeout(300);
        const steps = 20;
        for (let i = 1; i <= steps; i += 1) {
            await client.send('Input.dispatchTouchEvent', {
                type: 'touchMove',
                touchPoints: [
                    {
                        x: startX + ((endX - startX) * i) / steps,
                        y: startY + ((endY - startY) * i) / steps,
                    },
                ],
            });
        }
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

        await expect(columns).toContainText('Category');
        expect(consoleErrors).toEqual([]);
    });
});
