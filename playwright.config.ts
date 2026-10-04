import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end contract for connectWithTechies: the behaviour the app must keep,
 * checked in a real browser.
 *
 *   npm run test:e2e                          build, serve with `vite preview`, test
 *   E2E_BASE_URL=https://… npm run test:e2e   test a deployed copy (no local server)
 *
 * Locally it drives the Edge that ships with Windows (no browser download).
 * On CI, set E2E_CHANNEL=chromium after `npx playwright install chromium`.
 * Debugging: E2E_TRACE=1 keeps a trace of failures; E2E_WORKERS sets parallelism.
 */
const remote = process.env.E2E_BASE_URL;
const localURL = 'http://localhost:4173/connectWithTechies/';

const channel = process.env.E2E_CHANNEL || 'msedge';
const browser = channel === 'chromium' ? {} : { channel };
const desktop = { ...devices['Desktop Chrome'], ...browser, viewport: { width: 1440, height: 1000 } };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: Number(process.env.E2E_WORKERS) || (process.env.CI ? 2 : 4),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    baseURL: remote || localURL,
    // Traces snapshot the whole page at every step, which slows a long list
    // enough to time tests out. Opt in when debugging.
    trace: process.env.E2E_TRACE ? 'retain-on-failure' : 'off',
    ...browser,
  },
  projects: [
    { name: 'desktop', use: desktop, grepInvert: /@mobile|@perf/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...browser }, grep: /@mobile/ },
    // Timing budgets mean nothing while other browsers compete for the CPU, so
    // they run last, on their own, one at a time.
    { name: 'perf', use: desktop, grep: /@perf/, dependencies: ['desktop', 'mobile'], fullyParallel: false },
  ],
  webServer: remote ? undefined : {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: localURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
