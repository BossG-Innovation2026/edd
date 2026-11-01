// Module 3.1 Hazard Logging: server-side operations.
import type { HazardStatus, Role } from "@/generated/prisma/enums";
import type { Db } from "@/lib/db";
import { canSubmitHazardReport } from "@/modules/user-roles/permissions";
import { nextReportId } from "./report-id";
import {
  checkHazardClassification,
  hazardReportInputSchema,
  zodFieldErrors,
  type FieldErrors,
} from "./validation";

export type Reporter = { id: string; active: boolean; roles: Role[] };

export type SubmitResult =
  | { ok: true; reportId: string; id: string }
  | { ok: false; reason: "not_allowed"; message: string }
  | { ok: false; reason: "invalid"; errors: FieldErrors };

// FR-HL-01: any active user (in a role allowed by FR-UR-02) submits a hazard report
// with the Section 3.1 fields. New reports start as Submitted.
export async function submitHazardReport(db: Db, reporter: Reporter, raw: unknown): Promise<SubmitResult> {
  // NFR-SE-02: permissions are checked here on the server, not only in the form.
  if (!reporter.active) {
    return { ok: false, reason: "not_allowed", message: "Your account is not active yet. The School Head must approve it first." };
  }
  if (!canSubmitHazardReport(reporter.roles)) {
    return { ok: false, reason: "not_allowed", message: "Your role cannot submit hazard reports." };
  }

  const parsed = hazardReportInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid", errors: zodFieldErrors(parsed.error) };
  const input = parsed.data;

  // FR-HL-04: the zone must exist on the school map.
  const zone = await db.zone.findUnique({ where: { id: input.zoneId }, select: { id: true } });
  // FR-HL-02: the type must be on the predefined list and match the category.
  const type = await db.hazardType.findUnique({
    where: { id: input.typeId },
    select: { id: true, categoryId: true, isOther: true },
  });
  const errors: FieldErrors = {
    ...(zone ? {} : { zoneId: "Choose a zone from the list." }),
    ...checkHazardClassification(input, type),
  };
  if (Object.keys(errors).length > 0) return { ok: false, reason: "invalid", errors };

  const created = await db.$transaction(async (tx) => {
    const reportId = await nextReportId(tx, new Date());
    return tx.hazardReport.create({
      data: {
        reportId,
        typeId: input.typeId,
        // FR-HL-02: kept only for "Other" types.
        otherTypeSpecified: type!.isOther ? input.otherTypeSpecified!.trim() : null,
        zoneId: input.zoneId,
        locationDescription: input.locationDescription,
        observedAt: input.observedAt,
        description: input.description,
        initialSeverity: input.initialSeverity,
        status: "SUBMITTED",
        reporterId: reporter.id,
      },
      select: { id: true, reportId: true },
    });
  });
  return { ok: true, reportId: created.reportId, id: created.id };
}

// FR-HL-06: only verified reports enter risk scores and dashboards. A report counts as verified
// once a verifier has confirmed it, including while it is being mitigated or after it is resolved.
// (FR-RS-07 will further drop Resolved reports from *active* scores; that is Section 3.3's job.)
export const VERIFIED_STATUSES: readonly HazardStatus[] = ["VERIFIED", "MITIGATION_IN_PROGRESS", "RESOLVED"];

// FR-HL-06: the only query that risk scoring (3.3) and dashboards (3.5) may use to read hazards.
export function findVerifiedHazards(db: Db, where: { zoneId?: string } = {}) {
  return db.hazardReport.findMany({
    where: { ...where, status: { in: [...VERIFIED_STATUSES] } },
    include: { type: { include: { category: true } }, zone: true },
    orderBy: { createdAt: "asc" },
  });
}

// Data the report form needs: zones grouped by building (FR-HL-04) and the catalog (FR-HL-02).
export async function loadReportFormOptions(db: Db) {
  const [zones, categories] = await Promise.all([
    db.zone.findMany({ orderBy: { sortOrder: "asc" } }),
    db.hazardCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { types: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  return {
    zones: zones.map(({ id, building, floor, name }) => ({ id, building, floor, name })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      types: c.types.map((t) => ({ id: t.id, name: t.name, isOther: t.isOther })),
    })),
  };
}

export type ReportFormOptions = Awaited<ReturnType<typeof loadReportFormOptions>>;
