const { defineConfig, devices } = require("@playwright/test");

const frontendBaseUrl =
  process.env.E2E_FRONTEND_BASE_URL || "http://127.0.0.1:4173";
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || "4173");
const frontendHost =
  process.env.E2E_FRONTEND_HOST || "127.0.0.1";
const reuseExistingServer =
  process.env.PW_REUSE_EXISTING_SERVER === "1" ||
  process.env.PW_REUSE_EXISTING_SERVER === "true";

module.exports = defineConfig({
  testDir: "./tests/browser-e2e",
  timeout: 45000,
  expect: {
    timeout: 8000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["dot"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: frontendBaseUrl,
    bypassCSP: process.env.PW_BYPASS_CSP !== "0",
    trace: process.env.CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  webServer: {
    command: `npm run build && npm run preview -- --host ${frontendHost} --port ${frontendPort}`,
    url: frontendBaseUrl,
    reuseExistingServer,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "tablet",
      use: {
        ...devices["iPad Pro 11"],
        // Keep responsive coverage while avoiding local WebKit launch instability in smoke runs.
        browserName: "chromium",
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
