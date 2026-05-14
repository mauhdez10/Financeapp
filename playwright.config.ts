import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE_PATH } from "./global-setup";

/**
 * Golden Anchor Finance — Playwright config
 *
 * Auth: global-setup.ts logs in once with the test account, saves the
 * authenticated browser state to playwright/.auth/user.json, and every
 * project below reuses it via `storageState`. No App.jsx changes needed.
 *
 * baseURL: defaults to local dev server. Override with GA_BASE_URL env
 * var to test against https://finance.goldenanchor.life after a deploy.
 *
 * Run:
 *   npx playwright test                # all tests, all browsers, headless
 *   npx playwright test --ui           # interactive UI mode (recommended for dev)
 *   npx playwright test --headed       # see the browser as tests run
 *   npx playwright test calculators    # only calculator specs
 *   npx playwright codegen http://localhost:5173   # record actions into a test
 */
export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.GA_BASE_URL || "http://localhost:5173",
    storageState: STORAGE_STATE_PATH,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: process.env.START_DEV_SERVER
    ? {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }
    : undefined,
});
