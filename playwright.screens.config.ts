import { defineConfig } from "@playwright/test";

// Screenshots: BASE_URL=https://… SCREENS_DIR=/path pnpm screens
export default defineConfig({
  testDir: "./e2e",
  testMatch: "screens.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3601", browserName: "chromium" },
});
