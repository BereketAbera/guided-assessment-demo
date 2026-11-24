import { defineConfig } from "@playwright/test";

// Checks against a deployment: BASE_URL=https://… pnpm test:live
// Kept short on purpose: every answer here is a real write to the shared store.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "live.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: { baseURL: process.env.BASE_URL, browserName: "chromium", trace: "retain-on-failure" },
});
