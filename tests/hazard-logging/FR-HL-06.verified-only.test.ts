// FR-HL-06. Only verified reports shall be included in risk scores and dashboards.
// Risk scoring (3.3) and dashboards (3.5) are not built yet; they must read hazards through
// findVerifiedHazards, which is what these tests pin down.
import type { HazardStatus } from "@/generated/prisma/enums";
import type { Db } from "@/lib/db";
import { findVerifiedHazards, submitHazardReport, VERIFIED_STATUSES } from "@/modules/hazard-logging/service";
import { createTestDb, createUser, findType, firstZone, validInput } from "../support/db";

let db: Db;
const ALL_STATUSES: HazardStatus[] = [
  "SUBMITTED",
  "UNDER_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "MITIGATION_IN_PROGRESS",
  "RESOLVED",
];
const idByStatus = new Map<HazardStatus, string>();

beforeAll(async () => {
  db = await createTestDb();
  const reporter = await createUser(db, ["SCHOOL_PERSONNEL"]);
  const verifier = await createUser(db, ["DRRM_COORDINATOR"]);
  const type = await findType(db, "Facility and structural", "Electrical hazard");
  const zone = await firstZone(db);
  // One report per workflow status. The verification step is not built yet, so statuses are set directly.
  for (const status of ALL_STATUSES) {
    const result = await submitHazardReport(db, reporter, validInput(type, zone.id, { description: `Report in ${status}` }));
    if (!result.ok) throw new Error(JSON.stringify(result));
    const confirmed = ["VERIFIED", "MITIGATION_IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status);
    await db.hazardReport.update({
      where: { id: result.id },
      data: { status, verifiedById: confirmed ? verifier.id : null, verifiedAt: confirmed ? new Date() : null },
    });
    idByStatus.set(status, result.id);
  }
});
afterAll(async () => {
  await db.$disconnect();
});

describe("FR-HL-06 only verified reports feed risk scores and dashboards", () => {
  it("FR-HL-06: the verified set is Verified, Mitigation in progress, and Resolved", () => {
    expect([...VERIFIED_STATUSES].sort()).toEqual(["MITIGATION_IN_PROGRESS", "RESOLVED", "VERIFIED"]);
  });

  it("FR-HL-06: findVerifiedHazards returns only reports a verifier has confirmed", async () => {
    const hazards = await findVerifiedHazards(db);

    expect(hazards.map((h) => h.status).sort()).toEqual(["MITIGATION_IN_PROGRESS", "RESOLVED", "VERIFIED"]);
  });

  it.each(["SUBMITTED", "UNDER_VERIFICATION", "REJECTED"] as HazardStatus[])(
    "FR-HL-06: a %s report is excluded",
    async (status) => {
      const ids = (await findVerifiedHazards(db)).map((h) => h.id);

      expect(ids).not.toContain(idByStatus.get(status));
    },
  );

  it("FR-HL-06: a brand-new report is excluded until it is verified", async () => {
    const reporter = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);
    const result = await submitHazardReport(db, reporter, validInput(type, zone.id));
    if (!result.ok) throw new Error(JSON.stringify(result));

    expect((await findVerifiedHazards(db)).map((h) => h.id)).not.toContain(result.id);

    await db.hazardReport.update({ where: { id: result.id }, data: { status: "VERIFIED" } });
    expect((await findVerifiedHazards(db)).map((h) => h.id)).toContain(result.id);
  });

  it("FR-HL-06: the zone filter still excludes unverified reports", async () => {
    const zone = await firstZone(db);
    const hazards = await findVerifiedHazards(db, { zoneId: zone.id });

    expect(hazards.length).toBeGreaterThan(0);
    expect(hazards.every((h) => VERIFIED_STATUSES.includes(h.status))).toBe(true);
    expect(hazards.every((h) => h.zoneId === zone.id)).toBe(true);
  });
});
