// FR-HL-01. Any active user shall be able to submit a hazard report with the fields in Section 3.1.
import type { Role } from "@/generated/prisma/enums";
import type { Db } from "@/lib/db";
import { REPORT_ID_PATTERN } from "@/modules/hazard-logging/report-id";
import { submitHazardReport } from "@/modules/hazard-logging/service";
import { createTestDb, createUser, findType, firstZone, validInput } from "../support/db";

let db: Db;
beforeAll(async () => {
  db = await createTestDb();
});
afterAll(async () => {
  await db.$disconnect();
});

describe("FR-HL-01 submit a hazard report", () => {
  const submittingRoles: Role[] = ["SCHOOL_HEAD", "DRRM_COORDINATOR", "SCHOOL_PERSONNEL", "COMMUNITY_USER"];

  it.each(submittingRoles)("FR-HL-01: an active %s can submit a report", async (role) => {
    const user = await createUser(db, [role]);
    const type = await findType(db, "Facility and structural", "Structural damage");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(type, zone.id));

    expect(result.ok).toBe(true);
  });

  it("FR-HL-01: the saved record holds every Section 3.1 field, with status Submitted", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Facility and structural", "Structural damage");
    const zone = await firstZone(db);
    const input = validInput(type, zone.id, { initialSeverity: "HIGH" });

    const result = await submitHazardReport(db, user, input);
    if (!result.ok) throw new Error(JSON.stringify(result));

    const saved = await db.hazardReport.findUniqueOrThrow({
      where: { id: result.id },
      include: { type: { include: { category: true } }, zone: true, photos: true },
    });
    expect(saved.reportId).toMatch(REPORT_ID_PATTERN); // Report ID
    expect(saved.type.category.name).toBe("Facility and structural"); // category
    expect(saved.type.name).toBe("Structural damage"); // type
    expect(saved.zoneId).toBe(zone.id); // school zone
    expect(saved.locationDescription).toBe(input.locationDescription); // location description
    expect(saved.observedAt.toISOString()).toBe(input.observedAt); // date and time observed
    expect(saved.description).toBe(input.description); // description
    expect(saved.photos).toEqual([]); // photos (optional; upload is FR-HL-05)
    expect(saved.initialSeverity).toBe("HIGH"); // reporter's initial severity
    expect(saved.status).toBe("SUBMITTED"); // status
    expect(saved.reporterId).toBe(user.id); // reporter
    expect(saved.verifiedById).toBeNull(); // verified by
    expect(saved.verifiedAt).toBeNull(); // date verified
  });

  it("FR-HL-01: Report IDs are unique and sequential (HZ-<year>-<number>)", async () => {
    const user = await createUser(db, ["SCHOOL_PERSONNEL"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const a = await submitHazardReport(db, user, validInput(type, zone.id));
    const b = await submitHazardReport(db, user, validInput(type, zone.id));
    if (!a.ok || !b.ok) throw new Error("submission failed");

    const year = new Date().getFullYear();
    const seq = (id: string) => Number(id.split("-")[2]);
    expect(a.reportId.startsWith(`HZ-${year}-`)).toBe(true);
    expect(seq(b.reportId)).toBe(seq(a.reportId) + 1);
  });

  it("FR-HL-01: an inactive account cannot submit (FR-UR-03)", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"], false);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(type, zone.id));

    expect(result).toMatchObject({ ok: false, reason: "not_allowed" });
    expect(await db.hazardReport.count({ where: { reporterId: user.id } })).toBe(0);
  });

  it("FR-HL-01 with FR-UR-02: the System Administrator cannot submit reports", async () => {
    const user = await createUser(db, ["SYSTEM_ADMINISTRATOR"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(type, zone.id));

    expect(result).toMatchObject({ ok: false, reason: "not_allowed" });
  });

  it("FR-HL-01 with FR-UR-10: an account holding System Administrator and another role can submit", async () => {
    const user = await createUser(db, ["SYSTEM_ADMINISTRATOR", "SCHOOL_PERSONNEL"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    expect((await submitHazardReport(db, user, validInput(type, zone.id))).ok).toBe(true);
  });

  it.each(["description", "observedAt", "initialSeverity"])(
    "FR-HL-01: a report missing the required field %s is rejected with a message",
    async (field) => {
      const user = await createUser(db, ["COMMUNITY_USER"]);
      const type = await findType(db, "Natural", "Flood");
      const zone = await firstZone(db);

      const result = await submitHazardReport(db, user, validInput(type, zone.id, { [field]: undefined }));

      expect(result.ok).toBe(false);
      if (result.ok || result.reason !== "invalid") throw new Error("expected validation errors");
      expect(result.errors[field as keyof typeof result.errors]).toBeTruthy();
    },
  );

  it("FR-HL-01: initial severity accepts only Low, Moderate, or High", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(type, zone.id, { initialSeverity: "MEDIUM" }));

    expect(result).toMatchObject({ ok: false, reason: "invalid", errors: { initialSeverity: expect.any(String) } });
  });

  it("FR-HL-01: the date observed cannot be in the future", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = await submitHazardReport(db, user, validInput(type, zone.id, { observedAt: tomorrow }));

    expect(result).toMatchObject({ ok: false, reason: "invalid", errors: { observedAt: expect.any(String) } });
  });

  it("FR-HL-01: the reporter and status cannot be set from the form input", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const other = await createUser(db, ["SCHOOL_HEAD"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const result = await submitHazardReport(
      db,
      user,
      validInput(type, zone.id, { reporterId: other.id, status: "VERIFIED", verifiedById: other.id }),
    );
    if (!result.ok) throw new Error(JSON.stringify(result));

    const saved = await db.hazardReport.findUniqueOrThrow({ where: { id: result.id } });
    expect(saved.reporterId).toBe(user.id);
    expect(saved.status).toBe("SUBMITTED");
    expect(saved.verifiedById).toBeNull();
  });
});
