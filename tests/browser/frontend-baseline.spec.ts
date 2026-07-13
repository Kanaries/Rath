import { expect, test, type Page } from '@playwright/test';

async function expectApplicationShell(page: Page, path: string) {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedLocalRequests: string[] = [];
    let workerCount = 0;

    await page.route('**/_vercel/insights/script.js', (route) =>
        route.fulfill({
            status: 204,
            contentType: 'text/javascript',
            body: '',
        })
    );

    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', (request) => {
        if (new URL(request.url()).origin === 'http://127.0.0.1:4173') {
            failedLocalRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
        }
    });
    page.on('worker', () => {
        workerCount += 1;
    });

    await page.goto(path, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/RATH/i);
    await expect(page.locator('.main-app-container')).toBeVisible();
    await expect(page.locator('nav, [data-sidebar="sidebar"]')).toBeVisible();
    await expect.poll(() => workerCount, { message: 'the Rath computation Worker should start with the application' }).toBeGreaterThan(0);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
}

test('production build loads the application shell and starts a Worker', async ({ page }) => {
    await expectApplicationShell(page, '/');
});

test('production build remains usable below an unknown base path', async ({ page }) => {
    await expectApplicationShell(page, '/rath/');
});

test('Tailwind and shadcn keep compact controls, public assets and dialog behavior', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedLocalRequests: string[] = [];

    await page.route('**/_vercel/insights/script.js', (route) =>
        route.fulfill({ status: 204, contentType: 'text/javascript', body: '' })
    );
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', (request) => {
        if (new URL(request.url()).origin === 'http://127.0.0.1:4173') {
            failedLocalRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
        }
    });

    await page.goto('/rath/', { waitUntil: 'networkidle' });

    const createButton = page.getByRole('button', { name: /Create DataSource/i });
    await expect(createButton).toBeVisible();
    await expect(createButton).toHaveCSS('height', '32px');
    await expect(createButton).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(createButton).toHaveCSS('background-color', 'rgb(15, 15, 15)');

    await createButton.click();
    await expect(page.locator('main [role="button"]')).toHaveCount(5);
    const sourceImages = page.locator('main img');
    await expect(sourceImages).toHaveCount(5);
    await expect.poll(() => sourceImages.evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);

    await page.getByRole('button', { name: /Preferences/i }).click();
    await expect(page.getByRole('dialog', { name: /Preferences/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /Preferences/i })).toBeHidden();

    const dataSourceNavigation = page.getByRole('button', { name: 'DataSource', exact: true });
    await dataSourceNavigation.click();
    await expect(dataSourceNavigation).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: /Start Analysis/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
});

test('DataSource table preserves virtual scrolling, styling and text-pattern interactions', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedLocalRequests: string[] = [];

    await page.route('**/_vercel/insights/script.js', (route) =>
        route.fulfill({ status: 204, contentType: 'text/javascript', body: '' })
    );
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', (request) => {
        if (new URL(request.url()).origin === 'http://127.0.0.1:4173') {
            failedLocalRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
        }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Create DataSource/i }).click();
    await page.getByText('Demo', { exact: true }).click();
    await page.getByRole('gridcell', { name: /^Cars\b/ }).click();
    await expect(page.getByText(/9 columns × 406 rows/)).toBeVisible();

    const table = page.locator('table[data-virtualized="true"][data-horizontal-virtualized="true"]');
    const rows = table.locator(':scope > tbody > tr');
    const scroller = table.locator('..');
    await expect(table).toBeVisible();
    await expect.poll(() => rows.count()).toBeLessThan(60);
    await expect.poll(() => rows.first().locator(':scope > td').count()).toBeLessThanOrEqual(10);
    await expect(table.locator(':scope > thead > tr > th').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    const headerAlignment = await table.locator(':scope > thead > tr > th:not([aria-hidden])').evaluateAll((cells) =>
        cells.map((cell) => {
            const cellRect = cell.getBoundingClientRect();
            const contentRect = cell.firstElementChild?.getBoundingClientRect();
            return {
                cellTop: cellRect.top,
                contentTop: contentRect?.top,
                verticalAlign: getComputedStyle(cell).verticalAlign,
            };
        })
    );
    expect(headerAlignment.length).toBeGreaterThan(1);
    expect(headerAlignment.every(({ cellTop, contentTop, verticalAlign }) => verticalAlign === 'top' && contentTop === cellTop)).toBe(true);
    const headerCellGeometry = await table.locator(':scope > thead > tr > th:not([aria-hidden])').evaluateAll((cells) =>
        cells.map((cell) => {
            const cellRect = cell.getBoundingClientRect();
            const barRect = cell.querySelector('.bottom-bar')?.getBoundingClientRect();
            return {
                cellLeft: cellRect.left,
                cellRight: cellRect.right,
                barLeft: barRect?.left,
                barRight: barRect?.right,
            };
        })
    );
    expect(
        headerCellGeometry.every(
            ({ cellLeft, cellRight, barLeft, barRight }) => barLeft === cellLeft && barRight === cellRight
        )
    ).toBe(true);

    const dataHeaders = table.locator(':scope > thead > tr > th:not([aria-hidden])');
    const milesHeader = dataHeaders.filter({ hasText: 'Miles_per_Gallon' });
    const cylindersHeader = dataHeaders.filter({ hasText: 'Cylinders' });
    await expect(milesHeader).toHaveCount(1);
    await expect(cylindersHeader).toHaveCount(1);
    await milesHeader.hover();
    await expect(milesHeader.locator('.checkbox-container')).toBeVisible();
    await expect.poll(() => dataHeaders.locator('.checkbox-container').count()).toBe(1);
    const milesActionGeometry = await milesHeader.evaluate((cell) => {
        const cellRect = cell.getBoundingClientRect();
        const title = cell.querySelector('.header');
        const actionRects = Array.from(cell.querySelectorAll('.header-row button')).map((button) => button.getBoundingClientRect());
        return {
            titleIsClipped: title ? title.scrollWidth > title.clientWidth : false,
            actionsStayVisible: actionRects.length > 0 && actionRects.every((rect) => rect.left >= cellRect.left && rect.right <= cellRect.right),
        };
    });
    expect(milesActionGeometry).toEqual({ titleIsClipped: true, actionsStayVisible: true });

    const emptyComment = milesHeader.locator('.comment-row');
    await expect(emptyComment).toHaveText('');
    await expect(emptyComment).not.toHaveAttribute('data-state');
    await emptyComment.hover();
    await page.waitForTimeout(800);
    await expect(page.getByRole('tooltip')).toHaveCount(0);

    await cylindersHeader.hover();
    await expect(cylindersHeader.locator('.checkbox-container')).toBeVisible();
    await expect(milesHeader.locator('.checkbox-container')).toHaveCount(0);
    await expect.poll(() => dataHeaders.locator('.checkbox-container').count()).toBe(1);
    await page.getByText(/9 columns × 406 rows/).hover();
    await expect.poll(() => dataHeaders.locator('.checkbox-container').count()).toBe(0);
    await expect.poll(() => rows.first().evaluate((row) => row.getBoundingClientRect().height)).toBe(38);

    const negativeSubtleColor = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--negative-subtle)';
        document.body.appendChild(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
    });
    const rowColors = await rows.evaluateAll((elements) => elements.map((row) => getComputedStyle(row).backgroundColor));
    expect(rowColors).toContain(negativeSubtleColor);
    expect(rowColors).toContain('rgba(0, 0, 0, 0)');

    const initialHeader = await table.locator(':scope > thead').innerText();
    await scroller.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
    });
    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect.poll(() => table.locator(':scope > thead').innerText()).not.toBe(initialHeader);

    await scroller.evaluate((element) => {
        element.scrollLeft = 0;
        element.scrollTop = element.scrollHeight;
    });
    await expect(table.locator(':scope > tbody')).toContainText('chevy s-10');
    await scroller.evaluate((element) => {
        element.scrollTop = 0;
    });
    await expect.poll(() => scroller.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }))).toEqual({ left: 0, top: 0 });
    await expect(table.locator(':scope > thead')).toContainText('Name');
    const cellContent = table.locator(':scope > tbody > tr .cell-content').filter({ hasText: 'chevrolet chevelle malibu' });
    await expect(cellContent).toHaveCount(1);
    await expect(cellContent).toBeVisible();
    await cellContent.evaluate((element) => {
        const textNode = element.firstChild;
        if (!textNode) throw new Error('The DataSource cell has no selectable text node.');
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, Math.min(4, textNode.textContent?.length ?? 0));
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    });
    await expect(page.getByText('Suggestions', { exact: true })).toBeVisible();

    const excludeButton = table.locator('.tp-exclude-btn').first();
    await excludeButton.locator('..').hover();
    await expect(excludeButton).toBeVisible();
    await excludeButton.click();
    await expect(excludeButton).toHaveClass(/tp-exclude-btn-restore/);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
});

test('DataSource wide tables virtualize columns independently from row interactions', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    await page.route('**/_vercel/insights/script.js', (route) =>
        route.fulfill({ status: 204, contentType: 'text/javascript', body: '' })
    );
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Create DataSource/i }).click();
    await page.getByText('Demo', { exact: true }).click();
    await page.getByRole('gridcell', { name: /^Kepler\b/ }).click();
    await expect(page.getByText(/44 columns × 9218 rows/)).toBeVisible();

    const wideTable = page.locator('table[data-horizontal-virtualized="true"]');
    await expect(wideTable).toBeVisible();
    await expect.poll(() => wideTable.locator(':scope > thead > tr > th').count()).toBeLessThan(20);
    const scroller = wideTable.locator('..');
    const wideTableSize = await scroller.evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
    expect(wideTableSize.scrollWidth).toBeGreaterThan(wideTableSize.clientWidth * 5);
    const initialHeader = await wideTable.locator(':scope > thead').innerText();
    await scroller.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
    });
    await expect.poll(() => wideTable.locator(':scope > thead').innerText()).not.toBe(initialHeader);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
});

test('Monaco wrapper starts the configured editor and JSON Workers', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedLocalRequests: string[] = [];
    const workerUrls: string[] = [];

    await page.route('**/_vercel/insights/script.js', (route) =>
        route.fulfill({ status: 204, contentType: 'text/javascript', body: '' })
    );
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('worker', (worker) => workerUrls.push(worker.url()));
    page.on('requestfailed', (request) => {
        if (new URL(request.url()).origin === 'http://127.0.0.1:4173') {
            failedLocalRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
        }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Preferences/i }).click();
    await page.getByRole('tab', { name: 'Design', exact: true }).click();
    await page.getByRole('switch').click();

    await expect(page.locator('.monaco-editor')).toBeVisible();
    await expect.poll(() => workerUrls.some((url) => /json\.worker-.*\.js$/.test(url))).toBe(true);
    await expect.poll(() => workerUrls.some((url) => /editor\.worker-.*\.js$/.test(url))).toBe(true);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
});

test('React 19 loads Graphic Walker and completes a Shadow DOM drag', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedLocalRequests: string[] = [];

    await page.route('**/_vercel/insights/script.js', (route) =>
        route.fulfill({ status: 204, contentType: 'text/javascript', body: '' })
    );
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', (request) => {
        if (new URL(request.url()).origin === 'http://127.0.0.1:4173') {
            failedLocalRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
        }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Create DataSource/i }).click();
    await page.getByText('Demo', { exact: true }).click();
    await page.getByRole('gridcell', { name: /^Cars\b/ }).click();
    await expect(page.getByText(/9 columns × 406 rows/)).toBeVisible();
    await page.getByRole('button', { name: /Start Analysis/i }).click();
    await page.getByRole('button', { name: 'Exploration', exact: true }).click();

    const source = page.locator('[data-rbd-drag-handle-draggable-id]').first();
    const columns = page.locator('[data-rbd-droppable-id="columns"]');
    await expect(source).toBeVisible();
    await expect(columns).toBeVisible();
    const fieldName = (await source.innerText()).trim();
    const sourceBox = await source.boundingBox();
    const targetBox = await columns.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2 + 10, sourceBox!.y + sourceBox!.height / 2, { steps: 5 });
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + 20, { steps: 20 });
    await page.mouse.up();

    await expect(columns).toContainText(fieldName);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedLocalRequests).toEqual([]);
});
