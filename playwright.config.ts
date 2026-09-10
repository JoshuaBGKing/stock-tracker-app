import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
  webServer:
    process.env.STILLMARK_E2E_MANAGED_SERVER === "true"
      ? undefined
      : {
          command: "npm run dev -- --port 3100",
          url: "http://localhost:3100",
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
          env: {
            MARKET_DATA_MODE: "sample",
            NEXT_TELEMETRY_DISABLED: "1",
            ENABLE_REGISTRATION: "false",
            ENABLE_INNGEST_DEV: "false",
            ENABLE_AI_INSIGHTS: "false",
            ENABLE_BACKGROUND_EMAIL: "false",
          },
        },
});
