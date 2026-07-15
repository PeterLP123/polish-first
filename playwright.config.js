import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-functional", testIgnore: /visual\.spec\.js/, use: { ...devices["Desktop Chrome"] } },
    { name: "webkit-functional", testIgnore: /visual\.spec\.js/, use: { ...devices["iPhone 13"] } },
    {
      name: "chromium-desktop",
      testMatch: /visual\.spec\.js/,
      dependencies: ["chromium-functional", "webkit-functional"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit-mobile",
      testMatch: /visual\.spec\.js/,
      dependencies: ["chromium-functional", "webkit-functional"],
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});
