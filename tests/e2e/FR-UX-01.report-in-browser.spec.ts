// End-to-end checks in a real browser on a phone-sized screen.
// FR-UX-01: a report is completed in four steps. The elapsed time printed here is for a SCRIPTED run;
// the 3-minute target for a first-time human user (NFR-IC-01) still needs the Chapter 4 timing test.
import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.SEED_PASSWORD ?? "";

async function logIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/report");
}

test.beforeAll(() => {
  expect(PASSWORD, "SEED_PASSWORD must be set in .env").not.toBe("");
});

test("FR-UX-01 + FR-HL-01: an active community user sends a report in four steps", async ({ page }) => {
  await logIn(page, "community@test.local");
  const started = Date.now();

  // Step 1: zone and exact location (FR-HL-04)
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
  await page.getByLabel("Zone").selectOption({ label: "Covered court" });
  await page.getByLabel("Exact location").fill("North corner near the stage steps");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 2: category and type (FR-HL-02)
  await expect(page.getByText("Step 2 of 4")).toBeVisible();
  await page.getByLabel("Facility and structural").check();
  await page.getByLabel("Electrical hazard").check();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 3: description, time observed (pre-filled), initial severity
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await page.getByLabel("What did you see?").fill("Exposed wires hanging from the light fixture.");
  await page.getByLabel("High").check();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 4: review and submit
  await expect(page.getByText("Step 4 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Send report" }).click();

  const reportId = page.getByTestId("report-id");
  await expect(reportId).toHaveText(/^HZ-\d{4}-\d{5}$/);
  const seconds = (Date.now() - started) / 1000;
  console.log(`FR-UX-01 scripted run: four steps completed in ${seconds.toFixed(1)} s`);
  expect(seconds).toBeLessThan(180);

  // The report is stored with status Submitted (FR-HL-01).
  const db = new Database("e2e.db", { readonly: true });
  const row = db
    .prepare("SELECT status, locationDescription, initialSeverity FROM HazardReport WHERE reportId = ?")
    .get(await reportId.textContent()) as Record<string, string> | undefined;
  db.close();
  expect(row).toEqual({
    status: "SUBMITTED",
    locationDescription: "North corner near the stage steps",
    initialSeverity: "HIGH",
  });
});

test("FR-HL-01: an account that is not yet active cannot open the report form", async ({ page }) => {
  await logIn(page, "pending@test.local");
  await expect(page.getByRole("heading", { name: "Account not active yet" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Hazard report" })).toHaveCount(0);
});

test("FR-HL-01 with FR-UR-02: the System Administrator does not get the report form", async ({ page }) => {
  await logIn(page, "admin@test.local");
  await expect(page.getByRole("heading", { name: "Reports not available" })).toBeVisible();
  await expect(page.getByRole("form", { name: "Hazard report" })).toHaveCount(0);
});

test("FR-HL-01: the report form requires logging in", async ({ page }) => {
  await page.goto("/report");
  await page.waitForURL("**/login");
});
