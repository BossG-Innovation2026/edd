// Module 3.7: Report Generation service.
// FR-RP-01 to FR-RP-10: maintain report templates, generate reports, track approval.

import type { Db } from "@/lib/db";

// FR-RP-01: initialize report catalogue.
export async function seedReportTemplates(db: Db) {
  const templates = [
    {
      reportType: "DAMAGE_AND_IMPACT_IMRS",
      name: "Damage and Impact Report (IMRS)",
      legalBasis: "DO 21, s. 2015",
      trigger: "Any hazard affecting the school",
      deadline: "8 hours",
      recipient: "DepEd via IMRS",
    },
    {
      reportType: "CLASS_SUSPENSION_RECORD",
      name: "Class Suspension and Resumption Record",
      legalBasis: "DO 37, s. 2022",
      trigger: "Suspension or resumption of classes",
      deadline: "At time of decision",
      recipient: "DRRMS",
    },
    {
      reportType: "SCHOOL_RISK_PROFILE",
      name: "School Risk Profile Report",
      legalBasis: "RA 9155",
      trigger: "Monthly or on request",
      deadline: "Monthly",
      recipient: "School Head; School Improvement Plan",
    },
    {
      reportType: "INCIDENT_INTAKE_LEARNER_PROTECTION",
      name: "Incident Intake Sheet (Learner Protection)",
      legalBasis: "DO 6, s. 2026",
      trigger: "Bullying, abuse, violence, or harassment report",
      deadline: "Referral within 48 hours",
      recipient: "Disciplining Authority",
    },
  ];

  for (const template of templates) {
    await db.reportTemplate.upsert({
      where: { reportType: template.reportType },
      update: {},
      create: {
        ...template,
        version: "1.0",
        isActive: true,
      },
    });
  }
}

// FR-RP-03, FR-RP-05, FR-RP-06: generate report from verified records.
export async function generateReport(
  db: Db,
  reportType: string,
  sourceData: Record<string, unknown>
): Promise<{ ok: boolean; reportId?: string; error?: string }> {
  try {
    const template = await db.reportTemplate.findUnique({
      where: { reportType },
    });

    if (!template) {
      return { ok: false, error: "Report template not found" };
    }

    // FR-RP-03: unverified reports marked as draft.
    const report = await db.generatedReport.create({
      data: {
        reportType,
        sourceData: JSON.stringify(sourceData),
        isDraft: true, // Stays draft until School Head approves (FR-RP-05).
      },
    });

    return { ok: true, reportId: report.id };
  } catch (error) {
    console.error("generateReport error:", error);
    return { ok: false, error: "Failed to generate report" };
  }
}

// FR-RP-05: School Head approves report.
export async function approveReport(db: Db, reportId: string, approvedBy: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.generatedReport.update({
      where: { id: reportId },
      data: {
        isDraft: false,
        approvedBy,
        approvedAt: new Date(),
      },
    });
    return { ok: true };
  } catch (error) {
    console.error("approveReport error:", error);
    return { ok: false, error: "Failed to approve report" };
  }
}

// FR-RP-06: export report as PDF or Excel (placeholder).
export async function exportReport(
  db: Db,
  reportId: string,
  format: "PDF" | "EXCEL"
): Promise<{ ok: boolean; path?: string; error?: string }> {
  try {
    const report = await db.generatedReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { ok: false, error: "Report not found" };
    }

    // Placeholder: in production, generate actual PDF/Excel.
    const exportPath = `/reports/${reportId}.${format === "PDF" ? "pdf" : "xlsx"}`;

    await db.generatedReport.update({
      where: { id: reportId },
      data: {
        exportedAt: new Date(),
        exportFormat: format,
        exportPath,
      },
    });

    return { ok: true, path: exportPath };
  } catch (error) {
    console.error("exportReport error:", error);
    return { ok: false, error: "Failed to export report" };
  }
}

// FR-RP-04: get deadline countdown for report.
export async function getReportDeadline(db: Db, reportType: string) {
  const template = await db.reportTemplate.findUnique({
    where: { reportType },
  });

  if (!template) return null;

  // Parse deadline (e.g., "8 hours", "48 hours", "Monthly").
  const now = new Date();
  let dueAt: Date | null = null;

  if (template.deadline.includes("hour")) {
    const hours = parseInt(template.deadline.split(" ")[0]);
    dueAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
  } else if (template.deadline.includes("day")) {
    const days = parseInt(template.deadline.split(" ")[0]);
    dueAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  return {
    template,
    dueAt,
    hoursRemaining: dueAt ? (dueAt.getTime() - now.getTime()) / (60 * 60 * 1000) : null,
  };
}
