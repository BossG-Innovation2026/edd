// FR-IN-01 to FR-IN-08: Incident and damage reporting.
import { describe, it, expect, beforeAll } from "vitest";
import { createTestDb, createUser, firstZone } from "../support/db";
import type { Db } from "@/lib/db";
import { createDisasterIncident, createLearnerProtectionIncident } from "@/modules/incident-reporting/service";

let db: Db;
let head: string;
let zone: string;

beforeAll(async () => {
  db = await createTestDb();
  const headUser = await createUser(db, ["SCHOOL_HEAD"], true);
  head = headUser.id;
  zone = (await firstZone(db)).id;
});

describe("FR-IN-01: Disaster/facility incident recording", () => {
  it("records disaster incident with damage data", async () => {
    const result = await createDisasterIncident(
      db,
      {
        name: "Typhoon damage",
        description: "Strong winds caused roof damage",
        occurredAt: new Date(),
        zones: [zone],
        classroomsTotallyDamaged: 2,
        classroomsWithMajorDamage: 5,
        classroomsWithMinorDamage: 8,
        damagedArmchairs: 50,
        actionsTaken: "Assessed and blocked off damaged areas",
      },
      head
    );

    expect(result.ok).toBe(true);
    expect(result.id).toBeDefined();

    const incident = await db.incidentReport.findUnique({ where: { id: result.id! } });
    expect(incident?.name).toBe("Typhoon damage");
    expect(incident?.classroomsTotallyDamaged).toBe(2);
  });

  it("creates IMRS encoding deadline (8 hours)", async () => {
    const result = await createDisasterIncident(
      db,
      {
        name: "Flood damage test",
        occurredAt: new Date(),
        zones: [zone],
      },
      head
    );

    const deadlines = await db.incidentDeadline.findMany({
      where: { incidentId: result.id! },
    });

    expect(deadlines).toHaveLength(1);
    expect(deadlines[0]?.deadlineType).toBe("IMRS_ENCODING");
  });
});

describe("FR-IN-02: Learner protection incident recording", () => {
  it("records learner protection incident", async () => {
    const result = await createLearnerProtectionIncident(
      db,
      {
        nature: "Bullying incident",
        description: "Learner reported bullying by classmates",
        occurredAt: new Date(),
        learnersInvolved: 1,
        setting: "Playground, 2:00 PM",
        caseStatus: "Open",
      },
      head
    );

    expect(result.ok).toBe(true);
    const incident = await db.incidentReport.findUnique({
      where: { id: result.id! },
    });
    expect(incident?.isLearnerProtection).toBe(true);
    expect(incident?.learnersInvolved).toBe(1);
  });

  it("creates three deadlines for learner protection (48h, 10d, 30d)", async () => {
    const result = await createLearnerProtectionIncident(
      db,
      {
        nature: "Violence incident",
        occurredAt: new Date(),
        learnersInvolved: 2,
        setting: "School premises",
      },
      head
    );

    const deadlines = await db.incidentDeadline.findMany({
      where: { incidentId: result.id! },
    });

    expect(deadlines).toHaveLength(3);
    const types = deadlines.map((d) => d.deadlineType).sort();
    expect(types).toEqual(["FACT_FINDING", "REFERRAL_TO_AUTHORITY", "REPORT_TO_SDS"]);
  });
});

describe("FR-IN-05: Personnel casualty counts (not details)", () => {
  it("stores casualty counts as numbers only", async () => {
    const result = await createDisasterIncident(
      db,
      {
        name: "Major incident",
        occurredAt: new Date(),
        zones: [zone],
        personnelDeceased: 0,
        personnelInjured: 3,
        personnelMissing: 0,
        personnelDisplaced: 15,
      },
      head
    );

    const incident = await db.incidentReport.findUnique({ where: { id: result.id! } });
    expect(incident?.personnelInjured).toBe(3);
    expect(incident?.personnelDisplaced).toBe(15);
  });
});
