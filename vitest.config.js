import { defineConfig } from "vitest/config";

// Vitest = unit tests only (pure money/util functions in test/**/*.test.js).
// The Playwright e2e specs (tests/**/*.spec.ts) run separately via `npm run test:e2e`
// — they use @playwright/test, which collides with Vitest's runner, so exclude them.
export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    exclude: ["**/node_modules/**", "**/dist/**", ".claude/**", "tests/**", "e2e/**"],
    environment: "node",
  },
});
