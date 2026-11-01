// FR-HL-02. Reports shall be classified by category and type from a predefined list;
// "other" requires a description (decided with the user: a "Specify the hazard type" field).
import type { Db } from "@/lib/db";
import { HAZARD_CATALOG } from "@/modules/hazard-logging/catalog";
import { submitHazardReport } from "@/modules/hazard-logging/service";
import { createTestDb, createUser, findType, firstZone, validInput } from "../support/db";

let db: Db;
beforeAll(async () => {
  db = await createTestDb();
});
afterAll(async () => {
  await db.$disconnect();
});

describe("FR-HL-02 classification by category and type", () => {
  it("FR-HL-02: the predefined list matches the SRS Section 3.1 table exactly", async () => {
    const categories = await db.hazardCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { types: { orderBy: { sortOrder: "asc" } } },
    });
    const fromDb = categories.map((c) => ({ name: c.name, types: c.types.map((t) => t.name) }));

    expect(fromDb).toEqual([
      { name: "Natural", types: ["Earthquake", "Flood", "Typhoon and strong winds", "Landslide", "Other"] },
      {
        name: "Facility and structural",
        types: ["Fire hazard", "Electrical hazard", "Structural damage", "Blocked exits", "Unsafe furniture or equipment", "Other"],
      },
      {
        name: "Health and sanitation",
        types: ["Unsafe drinking water", "Sanitation facility problems", "Disease outbreak", "Food safety", "Other"],
      },
      {
        name: "Security and personal safety",
        types: ["Unauthorized entry or intruder", "Bullying", "Violence or fighting", "Harassment", "Other"],
      },
    ]);
    expect(HAZARD_CATALOG.map((c) => c.name)).toEqual(fromDb.map((c) => c.name));
  });

  it("FR-HL-02: each category has exactly one 'Other' type, flagged as such", async () => {
    const others = await db.hazardType.findMany({ where: { isOther: true }, include: { category: true } });
    expect(others).toHaveLength(4);
    expect(new Set(others.map((t) => t.category.name)).size).toBe(4);
    expect(others.every((t) => t.name === "Other")).toBe(true);
  });

  it("FR-HL-02: a type that is not on the predefined list is rejected", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(type, zone.id, { typeId: "made-up-type" }));

    expect(result).toMatchObject({ ok: false, reason: "invalid", errors: { typeId: expect.any(String) } });
  });

  it("FR-HL-02: a type that does not belong to the chosen category is rejected", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const flood = await findType(db, "Natural", "Flood");
    const fire = await findType(db, "Facility and structural", "Fire hazard");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(flood, zone.id, { categoryId: fire.categoryId }));

    expect(result).toMatchObject({ ok: false, reason: "invalid", errors: { typeId: expect.any(String) } });
  });

  it("FR-HL-02: a missing category or type is rejected", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const type = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(type, zone.id, { categoryId: "", typeId: "" }));

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid",
      errors: { categoryId: expect.any(String), typeId: expect.any(String) },
    });
  });

  it.each(HAZARD_CATALOG.map((c) => c.name))(
    "FR-HL-02: 'Other' in %s without saying what the hazard is is rejected",
    async (categoryName) => {
      const user = await createUser(db, ["COMMUNITY_USER"]);
      const other = await findType(db, categoryName, "Other");
      const zone = await firstZone(db);

      for (const blank of [undefined, "", "   "]) {
        const result = await submitHazardReport(db, user, validInput(other, zone.id, { otherTypeSpecified: blank }));
        expect(result).toMatchObject({ ok: false, reason: "invalid", errors: { otherTypeSpecified: expect.any(String) } });
      }
    },
  );

  it("FR-HL-02: 'Other' with the hazard type specified is accepted and the text is kept", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const other = await findType(db, "Natural", "Other");
    const zone = await firstZone(db);

    const result = await submitHazardReport(
      db,
      user,
      validInput(other, zone.id, { otherTypeSpecified: "  Snake sighting  " }),
    );
    if (!result.ok) throw new Error(JSON.stringify(result));

    const saved = await db.hazardReport.findUniqueOrThrow({ where: { id: result.id } });
    expect(saved.otherTypeSpecified).toBe("Snake sighting");
  });

  it("FR-HL-02: the 'specify' text is not stored for a type that is not 'Other'", async () => {
    const user = await createUser(db, ["COMMUNITY_USER"]);
    const flood = await findType(db, "Natural", "Flood");
    const zone = await firstZone(db);

    const result = await submitHazardReport(db, user, validInput(flood, zone.id, { otherTypeSpecified: "Leftover text" }));
    if (!result.ok) throw new Error(JSON.stringify(result));

    const saved = await db.hazardReport.findUniqueOrThrow({ where: { id: result.id } });
    expect(saved.otherTypeSpecified).toBeNull();
  });
});
