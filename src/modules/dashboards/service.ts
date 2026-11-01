// Module 3.5: Dashboards and Reports service.
// FR-DR-01 to FR-DR-07: role-based dashboards with risk profile, assets, surveys.

import type { Db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import { getSchoolRiskProfile } from "@/modules/risk-scoring/service";

// FR-DR-01: School Head dashboard.
export async function getSchoolHeadDashboard(db: Db) {
  const riskProfile = await getSchoolRiskProfile(db);

  // Hazard trends (high-band hazards).
  const highBandHazards = await db.riskScore.findMany({
    where: { band: "HIGH" },
    include: {
      hazard: { include: { type: { include: { category: true } }, zone: true } },
    },
    orderBy: { score: "desc" },
    take: 5,
  });

  // High-band assets (FR-DR-01: flagged separately because zone mean can hide badly damaged asset).
  const allAssets = await db.asset.findMany({
    include: {
      ratings: { orderBy: { ratedAt: "desc" }, take: 1 },
      zone: true,
    },
  });

  const highBandAssets = allAssets.filter((a) => {
    const latestVI = a.ratings[0]?.vulnerabilityIndex;
    return latestVI && latestVI >= 3.81; // DepEd HIGH band.
  });

  // Open mitigation actions (hazards in MITIGATION_IN_PROGRESS status).
  const openMitigations = await db.hazardReport.count({
    where: { status: "MITIGATION_IN_PROGRESS" },
  });

  return {
    riskProfile,
    highBandHazards: highBandHazards.length,
    highBandAssets: highBandAssets.length,
    openMitigations,
    hazardTrend: highBandHazards.slice(0, 3),
  };
}

// FR-DR-01: DRRM Coordinator dashboard.
export async function getDRRMCoordinatorDashboard(db: Db) {
  // Verification queue.
  const verificationQueue = await db.hazardReport.findMany({
    where: { status: "SUBMITTED" },
    include: { type: { include: { category: true } }, zone: true, reporter: true },
    take: 10,
  });

  // Inspection and expiry alerts (FR-AV-06: alert 14 days before).
  const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const upcomingAlerts = await db.asset.findMany({
    where: {
      nextServiceAt: {
        lte: twoWeeksFromNow,
        gte: new Date(),
      },
    },
    include: { zone: true },
    take: 10,
  });

  // Manual review queue (FR-SA-12: comments awaiting review).
  const manualReviewQueue = await db.surveyComment.findMany({
    where: { inManualReview: true, reviewedAt: null },
    take: 10,
  });

  // School Head views (shared dashboard).
  const riskProfile = await getSchoolRiskProfile(db);

  return {
    verificationQueue: verificationQueue.length,
    upcomingAlerts: upcomingAlerts.length,
    manualReviewQueue: manualReviewQueue.length,
    riskProfile,
    nextVerifications: verificationQueue.slice(0, 5),
    nextInspections: upcomingAlerts.slice(0, 5),
  };
}

// FR-DR-01: Community User dashboard (own submissions only).
export async function getCommunityUserDashboard(db: Db, userId: string) {
  const submissions = await db.hazardReport.findMany({
    where: { reporterId: userId },
    include: { type: { include: { category: true } }, zone: true },
    orderBy: { createdAt: "desc" },
  });

  const statusCounts = {
    SUBMITTED: submissions.filter((h) => h.status === "SUBMITTED").length,
    UNDER_VERIFICATION: submissions.filter((h) => h.status === "UNDER_VERIFICATION").length,
    VERIFIED: submissions.filter((h) => h.status === "VERIFIED").length,
    REJECTED: submissions.filter((h) => h.status === "REJECTED").length,
  };

  return {
    totalSubmissions: submissions.length,
    statusCounts,
    recent: submissions.slice(0, 5),
  };
}

// FR-DR-01: School Personnel dashboard (own tasks, summary risk view).
export async function getSchoolPersonnelDashboard(db: Db) {
  const riskProfile = await getSchoolRiskProfile(db);
  return {
    schoolRiskSummary: {
      totalHazards: riskProfile.totalHazards,
      highBandCount: riskProfile.bandCounts.HIGH,
      meanRisk: riskProfile.meanScore,
    },
  };
}

// FR-DR-04: Security incident register (DO 6 format).
export async function getSecurityIncidentRegister(db: Db) {
  return db.incidentReport.findMany({
    where: { isLearnerProtection: true },
    include: { deadlines: true },
    orderBy: { occurredAt: "desc" },
  });
}
