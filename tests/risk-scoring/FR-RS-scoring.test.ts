// FR-RS-01 to FR-RS-09: risk scoring (R = L × I) with VI and severity fallback.
import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, createUser, firstZone, findType } from "../support/db";
import type { Db } from "@/lib/db";
import { submitHazardReport } from "@/modules/hazard-logging/service";
import { computeRiskScore, getRiskBand, getSchoolRiskProfile } from "@/modules/risk-scoring/service";
import { createAsset, rateAsset } from "@/modules/asset-vulnerability/service";

let db: Db;
let head: string; // School Head (can verify)
let drrm: string; // DRRM Coordinator
let zone: string;
let naturalHazardType: string;
let naturalCategoryId: string;
let healthHazardType: string;
let healthCategoryId: string;

// Helper: submit and verify a hazard report.
async function submitAndVerifyHazard(
  zoneId: string,
  categoryId: string,
  typeId: string,
  description: string
): Promise<string> {
  const headUser = await db.user.findUnique({ where: { id: head }, include: { roles: { select: { role: true } } } });
  const reported = await submitHazardReport(db, { id: head, active: true, roles: headUser?.roles.map((r) => r.role) ?? [] }, {
    zoneId,
    locationDescription: "Test location",
    categoryId,
    typeId,
    description,
    observedAt: new Date(),
    initialSeverity: "MODERATE",
  });
  if (!reported.ok) throw new Error(`Submit failed: ${JSON.stringify(reported)}`);
  await db.hazardReport.update({
    where: { id: reported.id },
    data: { status: "VERIFIED", verifiedById: head, verifiedAt: new Date() },
  });
  return reported.id;
}

beforeAll(async () => {
  db = await createTestDb();
  const headUser = await createUser(db, ["SCHOOL_HEAD"], true);
  const drrmUser = await createUser(db, ["DRRM_COORDINATOR"], true);
  head = headUser.id;
  drrm = drrmUser.id;

  zone = (await firstZone(db)).id;

  const naturalType = await findType(db, "Natural", "Flood");
  const healthType = await findType(db, "Health and sanitation", "Unsafe drinking water");
  naturalHazardType = naturalType.id;
  naturalCategoryId = naturalType.categoryId;
  healthHazardType = healthType.id;
  healthCategoryId = healthType.categoryId;
});

describe("FR-RS-01, FR-RS-02: Risk score R = L × I with zone VI mean", () => {
  it("computes R = L × I when zone has rated assets", async () => {
    // Setup: zone with asset rated VI 3.0
    const categoryId = (await db.assetCategory.findFirst())!.id;
    const assetResult = await createAsset(db, { categoryId, name: "Test asset", zoneId: zone }, drrm);
    await rateAsset(
      db,
      assetResult.id!,
      {
        physicalCondition: 3,
        exposure: 3,
        criticality: 3,
        adaptiveCapacityGap: 3,
        maintenanceStatus: 3,
      },
      drrm
    );

    // Submit and verify hazard.
    const hazardId = await submitAndVerifyHazard(zone, naturalCategoryId, naturalHazardType, "Water pooling on floor");

    // Compute risk score: L = 4, I = VI 3.0, R = 4 × 3.0 = 12.0 (Medium).
    const result = await computeRiskScore(db, { hazardId, likelihood: 4 }, head);

    expect(result.ok).toBe(true);
    expect(result.score).toBe(12.0); // 4 × 3.0
    expect(result.band).toBe("MEDIUM");
  });
});

describe("FR-RS-03: Risk score with verifier severity for health/sanitation/security hazards", () => {
  it("uses verifier severity (S) when hazard type is health/sanitation", async () => {
    // Submit and verify a health hazard (no zone VI needed).
    const hazardId = await submitAndVerifyHazard(zone, healthCategoryId, healthHazardType, "Discolored water");

    // Compute with severity: L = 3, S = 2, R = 3 × 2 = 6.0 (Low).
    const result = await computeRiskScore(
      db,
      { hazardId, likelihood: 3, severity: 2 },
      head
    );

    expect(result.ok).toBe(true);
    expect(result.score).toBe(6.0);
    expect(result.band).toBe("LOW");
  });
});

describe("FR-RS-04: Fallback severity when zone has no rated assets", () => {
  it("requires fallback severity if natural hazard zone has no assets", async () => {
    // Create a zone with no assets.
    const emptyZone = await db.zone.create({
      data: { building: "Test", floor: "Test", name: "Empty zone for RS test" },
    });

    // Submit and verify hazard in empty zone.
    const hazardId = await submitAndVerifyHazard(emptyZone.id, naturalCategoryId, naturalHazardType, "Test hazard");

    // Try to compute without severity: should fail.
    const resultNoSeverity = await computeRiskScore(
      db,
      { hazardId, likelihood: 3 },
      head
    );
    expect(resultNoSeverity.ok).toBe(false);

    // Provide fallback severity: should succeed.
    const resultWithSeverity = await computeRiskScore(
      db,
      { hazardId, likelihood: 3, severity: 4 },
      head
    );
    expect(resultWithSeverity.ok).toBe(true);
    expect(resultWithSeverity.score).toBe(12.0); // 3 × 4
  });
});

describe("FR-RS-06: Risk band classification", () => {
  it("classifies Low (1.00–8.20), Medium (8.21–17.80), High (17.81–25.00)", () => {
    expect(getRiskBand(1.0)).toBe("LOW");
    expect(getRiskBand(8.2)).toBe("LOW");
    expect(getRiskBand(8.21)).toBe("MEDIUM");
    expect(getRiskBand(17.8)).toBe("MEDIUM");
    expect(getRiskBand(17.81)).toBe("HIGH");
    expect(getRiskBand(25.0)).toBe("HIGH");
  });
});

describe("FR-RS-08: School risk profile", () => {
  it("aggregates counts by band, highest, and mean scores", async () => {
    // Create zone with asset VI 2.0.
    const testZone = await db.zone.create({
      data: { building: "Profile test", floor: "G", name: "Profile zone" },
    });
    const categoryId = (await db.assetCategory.findFirst())!.id;
    const asset = await createAsset(db, { categoryId, name: "Asset", zoneId: testZone.id }, drrm);
    await rateAsset(
      db,
      asset.id!,
      {
        physicalCondition: 2,
        exposure: 2,
        criticality: 2,
        adaptiveCapacityGap: 2,
        maintenanceStatus: 2,
      },
      drrm
    );

    // Submit 3 hazards: L=2 (R=4 LOW), L=4 (R=8 LOW), L=5 (R=10 MEDIUM).
    const h1Id = await submitAndVerifyHazard(testZone.id, naturalCategoryId, naturalHazardType, "H1");
    const h2Id = await submitAndVerifyHazard(testZone.id, naturalCategoryId, naturalHazardType, "H2");
    const h3Id = await submitAndVerifyHazard(testZone.id, naturalCategoryId, naturalHazardType, "H3");

    await computeRiskScore(db, { hazardId: h1Id, likelihood: 2 }, head);
    await computeRiskScore(db, { hazardId: h2Id, likelihood: 4 }, head);
    await computeRiskScore(db, { hazardId: h3Id, likelihood: 5 }, head);

    // Get scores only for this test's zone.
    const scoresInZone = await db.riskScore.findMany({
      include: { hazard: { include: { zone: true } } },
      where: { hazard: { zoneId: testZone.id } },
    });

    expect(scoresInZone).toHaveLength(3);
    const lowCount = scoresInZone.filter((s) => s.band === "LOW").length;
    const mediumCount = scoresInZone.filter((s) => s.band === "MEDIUM").length;
    const scores = scoresInZone.map((s) => s.score);

    expect(lowCount).toBe(2); // 4.0, 8.0
    expect(mediumCount).toBe(1); // 10.0
    expect(Math.max(...scores)).toBe(10.0);
    const meanScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
    expect(meanScore).toBe(7.33); // (4 + 8 + 10) / 3 = 7.33...
  });
});
