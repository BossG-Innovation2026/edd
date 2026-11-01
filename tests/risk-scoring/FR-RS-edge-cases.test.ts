// FR-RS-01 to FR-RS-09: risk scoring edge cases and verification.
import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, createUser, firstZone, findType } from "../support/db";
import type { Db } from "@/lib/db";
import { submitHazardReport } from "@/modules/hazard-logging/service";
import { computeRiskScore } from "@/modules/risk-scoring/service";
import { getRiskBand } from "@/modules/risk-scoring/service";

let db: Db;
let head: string;
let zone: string;
let naturalHazardType: string;
let naturalCategoryId: string;

beforeAll(async () => {
  db = await createTestDb();
  const headUser = await createUser(db, ["SCHOOL_HEAD"], true);
  head = headUser.id;
  zone = (await firstZone(db)).id;

  const naturalType = await findType(db, "Natural", "Flood");
  naturalHazardType = naturalType.id;
  naturalCategoryId = naturalType.categoryId;
});

async function submitAndVerifyHazard(description: string): Promise<string> {
  const headUser = await db.user.findUnique({ where: { id: head }, include: { roles: { select: { role: true } } } });
  const reported = await submitHazardReport(db, { id: head, active: true, roles: headUser?.roles.map((r) => r.role) ?? [] }, {
    zoneId: zone,
    locationDescription: "Test",
    categoryId: naturalCategoryId,
    typeId: naturalHazardType,
    description,
    observedAt: new Date(),
    initialSeverity: "MODERATE",
  });
  if (!reported.ok) throw new Error("Submit failed");
  await db.hazardReport.update({
    where: { id: reported.id },
    data: { status: "VERIFIED", verifiedById: head, verifiedAt: new Date() },
  });
  return reported.id;
}

describe("FR-RS-01, FR-RS-02: Risk score only for verified hazards", () => {
  it("rejects risk score computation for non-verified hazard", async () => {
    const headUser = await db.user.findUnique({ where: { id: head }, include: { roles: { select: { role: true } } } });
    const reported = await submitHazardReport(db, { id: head, active: true, roles: headUser?.roles.map((r) => r.role) ?? [] }, {
      zoneId: zone,
      locationDescription: "Test",
      categoryId: naturalCategoryId,
      typeId: naturalHazardType,
      description: "Unverified hazard",
      observedAt: new Date(),
      initialSeverity: "MODERATE",
    });
    if (!reported.ok) throw new Error("Submit failed");

    // Try to score without verifying.
    const result = await computeRiskScore(
      db,
      { hazardId: reported.id, likelihood: 3 },
      head
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("invalid");
  });
});

describe("FR-RS-01: Risk score computation stores result", () => {
  it("stores computed risk score with likelihood, impact, and band", async () => {
    const hazardId = await submitAndVerifyHazard("Scoring storage test");

    // Compute score: L=2, S=3, R=6 (LOW).
    const result = await computeRiskScore(db, { hazardId, likelihood: 2, severity: 3 }, head);
    expect(result.ok).toBe(true);
    expect(result.score).toBe(6.0);
    expect(result.band).toBe("LOW");

    const score = await db.riskScore.findUnique({ where: { hazardId } });
    expect(score?.likelihood).toBe(2);
    expect(score?.impact).toBe(3);
    expect(score?.score).toBe(6.0);
    expect(score?.band).toBe("LOW");
  });
});

describe("FR-RS-06: Risk bands for extreme values", () => {
  it("handles minimum and maximum possible scores", () => {
    expect(getRiskBand(1.0)).toBe("LOW");
    expect(getRiskBand(25.0)).toBe("HIGH");
    expect(getRiskBand(8.2)).toBe("LOW");
    expect(getRiskBand(8.21)).toBe("MEDIUM");
    expect(getRiskBand(17.8)).toBe("MEDIUM");
    expect(getRiskBand(17.81)).toBe("HIGH");
  });
});

describe("FR-RS-03, FR-RS-04: Severity rating validation", () => {
  it("rejects invalid severity ratings (not 1-5)", async () => {
    const hazardId = await submitAndVerifyHazard("Severity validation test");

    const resultTooLow = await computeRiskScore(
      db,
      { hazardId, likelihood: 3, severity: 0 },
      head
    );
    expect(resultTooLow.ok).toBe(false);

    const resultTooHigh = await computeRiskScore(
      db,
      { hazardId, likelihood: 3, severity: 6 },
      head
    );
    expect(resultTooHigh.ok).toBe(false);

    const resultValid = await computeRiskScore(
      db,
      { hazardId, likelihood: 3, severity: 5 },
      head
    );
    expect(resultValid.ok).toBe(true);
  });
});
