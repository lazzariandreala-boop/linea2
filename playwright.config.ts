import { defineConfig, devices } from '@playwright/test'

const PORT = 3123
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  // Mobile-first: emulate a phone, the primary audience.
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 5'] } }],
  webServer: {
    // Build then serve the production output (mock mode is the default).
    command: `npm run build && PORT=${PORT} NUXT_PUBLIC_SITE_URL=${BASE_URL} node .output/server/index.mjs`,
    url: BASE_URL,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
})
