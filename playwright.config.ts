import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end contract for connectWithTechies.
 *
 * The same suite runs against any build of the app:
 *
 *   npm run test:e2e                       the app, built and served by `vite preview`
 *   E2E_TARGET=legacy npm run test:e2e     the pre-React app, served from the repo root
 *   E2E_BASE_URL=https://… npm run test:e2e   any deployed copy (no local server)
 *
 * It drives the Edge already installed on Windows (channel 'msedge'); on CI,
 * where Edge is absent, set E2E_CHANNEL=chromium after `npx playwright install chromium`.
 */
const target = process.env.E2E_TARGET || 'app';
const remote = process.env.E2E_BASE_URL;

const local = target === 'legacy'
  ? { url: 'http://localhost:5199/', command: 'node scripts/serve.mjs', env: { PORT: '5199' } }
  : { url: 'http://localhost:4173/connectWithTechies/', command: 'npm run build && npm run preview -- --port 4173 --strictPort', env: {} };

const channel = process.env.E2E_CHANNEL || 'msedge';
const browser = channel === 'chromium' ? {} : { channel };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: Number(process.env.E2E_WORKERS) || (process.env.CI ? 2 : 4),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: remote || local.url,
    // Traces snapshot the whole DOM at every step — thousands of rows make that
    // slow enough to time tests out. Opt in when debugging: E2E_TRACE=1.
    trace: process.env.E2E_TRACE ? 'retain-on-failure' : 'off',
    ...browser,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...browser, viewport: { width: 1440, height: 1000 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...browser }, grep: /@mobile/ },
  ],
  webServer: remote ? undefined : {
    command: local.command,
    url: local.url,
    env: local.env,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
