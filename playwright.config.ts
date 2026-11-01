import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// A separate database for browser tests, rebuilt before each run (tests/e2e/global-setup.ts).
export const E2E_DATABASE_URL = "file:./e2e.db";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  // FR-UX-10: run on a small phone screen.
  projects: [{ name: "phone", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      NEXTAUTH_URL: `http://localhost:${PORT}`,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "e2e-only-secret",
    },
  },
});
