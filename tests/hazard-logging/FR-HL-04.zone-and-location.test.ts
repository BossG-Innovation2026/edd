// FR-HL-04. The reporter shall select a zone on the map and describe the exact location in text.
// (Decided with the user: zones are picked from a list grouped by building until FR-HL-03 builds the map.)
import type { Db } from "@/lib/db";
import { loadReportFormOptions, submitHazardReport } from "@/modules/hazard-logging/service";
import { SAMPLE_ZONES } from "../../prisma/seed";
import { createTestDb, createUser, findType, firstZone, validInput } from "../support/db";

let db: Db;
beforeAll(async () => {
  db = await createTestDb();
});
afterAll(async () => {
  await db.$disconnect();
});

describe("FR-HL-04 zone and exact location", () => {
  it("FR-HL-04: the form offers every school-map zone with its building and floor", async () => {
    const { zones } = await loadReportFormOptions(db);

    expect(zones.map(({ building, floor, name }) => ({ building, floor, name }))).toEqual(SAMPLE_ZONES);
  });

  it("FR-HL-04: the chosen zone and the exact location text are saved with the report", async () => {
    const user = await createUser(db, ["SCHOOL_PERSONNEL"]);
    const type = await findType(db, "Facility and structural", "Blocked exits");
    const zone = await db.zone.findFirstOrThrow({ where: { name: "Stairway and main exit" } });

    const result = await submitHazardReport(
      db,
      user,
      validInput(type, zone.id, { locationDescription: "Bottom of the east stairway, by the fire door" }),
    );
    if (!result.ok) throw new Error(JSON.stringify(result));

    const saved = await db.hazardReport.findUniqueOrThrow({ where: { id: result.id }, include: { zone: true } });
    expect(saved.zone).toMatchObject({ building: "Building A", floor: "Ground floor", name: "Stairway and main exit" });
    expect(saved.locationDescription).toBe("Bottom of the east stairway, by the fire door");
  });

  it("FR-HL-04: a report without a zone is rejected", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Natural", "Flood");

    const result = await submitHazardReport(db, user, validInput(type, "", {}));

    expect(result).toMatchObject({ ok: false, reason: "invalid", errors: { zoneId: expect.any(String) } });
  });

  it("FR-HL-04: a zone that is not on the school map is rejected", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Natural", "Flood");

    const result = await submitHazardReport(db, user, validInput(type, "not-a-real-zone"));

    expect(result).toMatchObject({ ok: false, reason: "invalid", errors: { zoneId: expect.any(String) } });
  });

  it.each([undefined, "", "    "])("FR-HL-04: a missing or blank exact location (%j) is rejected", async (blank) => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(type, zone.id, { locationDescription: blank }));

    expect(result).toMatchObject({ ok: false, reason: "invalid", errors: { locationDescription: expect.any(String) } });
  });
});
