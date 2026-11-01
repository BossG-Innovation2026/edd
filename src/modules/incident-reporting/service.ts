// Module 3.6: Incident and Damage Reporting service.
// FR-IN-01 to FR-IN-08: disaster/facility and learner protection incident management.

import type { Db } from "@/lib/db";
import type { IncidentType } from "@/generated/prisma/enums";

export interface DisasterIncidentInput {
  name: string;
  description?: string;
  occurredAt: Date;
  zones: string[]; // zone IDs
  classroomsTotallyDamaged?: number;
  classroomsWithMajorDamage?: number;
  classroomsWithMinorDamage?: number;
  temporaryLearningSpacesNeeded?: boolean;
  personnelDeceased?: number;
  personnelInjured?: number;
  personnelMissing?: number;
  personnelDisplaced?: number;
  damagedArmchairs?: number;
  damagedLearningMaterials?: number;
  damagedComputerSets?: number;
  actionsTaken?: string;
  linkedHazards?: string[]; // hazard IDs
}

export interface LearnerProtectionIncidentInput {
  nature: string;
  description?: string;
  occurredAt: Date;
  learnersInvolved: number; // count only, FR-IN-05
  setting: string; // date, time, location as text
  preventiveMeasures?: string;
  caseStatus?: string;
  linkedHazards?: string[];
}

// FR-IN-01: School Head and DRRM Coordinator record disaster/facility incidents.
export async function createDisasterIncident(
  db: Db,
  input: DisasterIncidentInput,
  reportedBy: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const incident = await db.incidentReport.create({
      data: {
        incidentNumber: `INC-${Date.now()}`, // Simplified ID; production would use a counter.
        type: "DISASTER_OR_FACILITY",
        name: input.name,
        description: input.description,
        occurredAt: input.occurredAt,
        zones: JSON.stringify(input.zones),
        classroomsTotallyDamaged: input.classroomsTotallyDamaged,
        classroomsWithMajorDamage: input.classroomsWithMajorDamage,
        classroomsWithMinorDamage: input.classroomsWithMinorDamage,
        temporaryLearningSpacesNeeded: input.temporaryLearningSpacesNeeded,
        personnelDeceased: input.personnelDeceased,
        personnelInjured: input.personnelInjured,
        personnelMissing: input.personnelMissing,
        personnelDisplaced: input.personnelDisplaced,
        damagedArmchairs: input.damagedArmchairs,
        damagedLearningMaterials: input.damagedLearningMaterials,
        damagedComputerSets: input.damagedComputerSets,
        actionsTaken: input.actionsTaken,
        linkedHazards: JSON.stringify(input.linkedHazards ?? []),
        reportedBy,
      },
    });

    // FR-IN-07: create deadline alert for IMRS encoding (8 hours).
    const imrsDeadline = new Date(incident.occurredAt.getTime() + 8 * 60 * 60 * 1000);
    await db.incidentDeadline.create({
      data: {
        incidentId: incident.id,
        deadlineType: "IMRS_ENCODING",
        dueAt: imrsDeadline,
      },
    });

    return { ok: true, id: incident.id };
  } catch (error) {
    console.error("createDisasterIncident error:", error);
    return { ok: false, error: "Failed to create incident" };
  }
}

// FR-IN-02: School Head and designated Child Protection Officers record learner protection incidents.
export async function createLearnerProtectionIncident(
  db: Db,
  input: LearnerProtectionIncidentInput,
  reportedBy: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const incident = await db.incidentReport.create({
      data: {
        incidentNumber: `INC-${Date.now()}`,
        type: "LEARNER_PROTECTION",
        name: input.nature,
        description: input.description,
        occurredAt: input.occurredAt,
        zones: JSON.stringify([]),
        nature: input.nature,
        learnersInvolved: input.learnersInvolved,
        setting: input.setting,
        preventiveMeasures: input.preventiveMeasures,
        caseStatus: input.caseStatus ?? "Open",
        linkedHazards: JSON.stringify(input.linkedHazards ?? []),
        isLearnerProtection: true,
        reportedBy,
      },
    });

    // FR-IN-07: create deadline alerts for learner protection (48 hours, 10 days, 30 days).
    const now = incident.occurredAt;
    await db.incidentDeadline.createMany({
      data: [
        {
          incidentId: incident.id,
          deadlineType: "REFERRAL_TO_AUTHORITY",
          dueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        },
        {
          incidentId: incident.id,
          deadlineType: "FACT_FINDING",
          dueAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        },
        {
          incidentId: incident.id,
          deadlineType: "REPORT_TO_SDS",
          dueAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    return { ok: true, id: incident.id };
  } catch (error) {
    console.error("createLearnerProtectionIncident error:", error);
    return { ok: false, error: "Failed to create incident" };
  }
}

// FR-IN-07: check for overdue deadlines and alert.
export async function checkOverdueDeadlines(db: Db) {
  const now = new Date();
  const overdue = await db.incidentDeadline.findMany({
    where: {
      dueAt: { lte: now },
      isOverdue: false,
    },
    include: { incident: true },
  });

  // Mark as overdue.
  for (const deadline of overdue) {
    await db.incidentDeadline.update({
      where: { id: deadline.id },
      data: { isOverdue: true },
    });
  }

  return overdue;
}
