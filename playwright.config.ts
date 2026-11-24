import { defineConfig } from "@playwright/test";

// Local runs start the production build with the in-memory store, on port 3601 unless E2E_PORT says otherwise.
const port = process.env.E2E_PORT ?? "3601";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["journey.spec.ts", "admin.spec.ts", "pages.spec.ts"],
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: { baseURL, browserName: "chromium", trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `pnpm exec next start -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { GA_STORE: "memory" },
  },
});
