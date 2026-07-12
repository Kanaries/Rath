import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 60_000,
    use: {
        baseURL: 'http://127.0.0.1:4199',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'yarn dev',
        url: 'http://127.0.0.1:4199',
        reuseExistingServer: false,
    },
});
