// Module 3.3 Risk Scoring service.
// FR-RS-01 to FR-RS-09: compute R = L × I for verified hazards.

import type { Db } from "@/lib/db";
import { getZoneMeanVI } from "@/modules/asset-vulnerability/service";

export interface ComputeRiskScoreInput {
  hazardId: string;
  likelihood: number; // 1-5
  severity?: number;  // 1-5, used when no zone VI available (FR-RS-04)
}

export interface ComputeRiskScoreResult {
  ok: boolean;
  scoreId?: string;
  score?: number;
  band?: string;
  reason?: string;
  errors?: Record<string, string>;
}

// Risk band boundaries (Section 3.3): Low (1.00–8.20), Medium (8.21–17.80), High (17.81–25.00).
export function getRiskBand(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score >= 17.81) return "HIGH";
  if (score >= 8.21) return "MEDIUM";
  return "LOW";
}

// Helper: determine if a hazard type should use zone VI or verifier severity.
// Section 3.3: natural and facility hazards use VI; health, sanitation, security use S.
export async function getHazardImpactType(db: Db, hazardId: string): Promise<"VI_MEAN" | "SEVERITY"> {
  const hazard = await db.hazardReport.findUnique({
    where: { id: hazardId },
    include: { type: { include: { category: true } } },
  });

  if (!hazard) throw new Error("Hazard not found");

  const categoryCode = hazard.type.category.code;
  // Natural and facility use VI; others use severity.
  if (categoryCode === "NATURAL" || categoryCode === "FACILITY_AND_STRUCTURAL") {
    return "VI_MEAN";
  }
  return "SEVERITY";
}

// FR-RS-01, FR-RS-02, FR-RS-03, FR-RS-04: compute risk score for a verified hazard.
// Only computed for verified hazards (FR-RS-01 says "each verified hazard").
export async function computeRiskScore(
  db: Db,
  input: ComputeRiskScoreInput,
  userId: string
): Promise<ComputeRiskScoreResult> {
  try {
    // Get hazard and check it's verified (only verified reports get risk scores, FR-HL-06).
    const hazard = await db.hazardReport.findUnique({
      where: { id: input.hazardId },
      include: { zone: true, type: { include: { category: true } } },
    });

    if (!hazard) {
      return { ok: false, reason: "not_found", errors: { hazardId: "Hazard not found." } };
    }

    if (hazard.status !== "VERIFIED") {
      return { ok: false, reason: "invalid", errors: { status: "Risk scores are computed only for verified hazards (FR-HL-06)." } };
    }

    // Validate likelihood 1-5.
    if (!Number.isInteger(input.likelihood) || input.likelihood < 1 || input.likelihood > 5) {
      return { ok: false, reason: "invalid", errors: { likelihood: "Likelihood must be an integer 1–5." } };
    }

    // Determine impact: VI mean of zone's assets, or verifier severity.
    const impactType = await getHazardImpactType(db, input.hazardId);
    let impact: number;
    let usedVI = true;

    if (impactType === "VI_MEAN") {
      // FR-RS-02: for natural/facility, I = mean VI of assets in zone.
      const zoneVI = await getZoneMeanVI(db, hazard.zoneId);
      if (zoneVI !== null) {
        impact = zoneVI;
      } else {
        // FR-RS-04: fallback to verifier severity if no assets rated.
        if (input.severity === undefined || input.severity < 1 || input.severity > 5) {
          return {
            ok: false,
            reason: "invalid",
            errors: {
              severity: "Zone has no rated assets. Provide verifier severity (1–5) as fallback (FR-RS-04).",
            },
          };
        }
        impact = input.severity;
        usedVI = false;
      }
    } else {
      // FR-RS-03: for health/sanitation/security, I = verifier severity S.
      if (input.severity === undefined || input.severity < 1 || input.severity > 5) {
        return { ok: false, reason: "invalid", errors: { severity: "Severity must be an integer 1–5." } };
      }
      impact = input.severity;
      usedVI = false;
    }

    // Compute R = L × I (Section 3.3).
    const score = Math.round(input.likelihood * impact * 100) / 100;
    const band = getRiskBand(score);

    // Store risk score (FR-RS-05: keep history).
    const riskScore = await db.riskScore.create({
      data: {
        hazardId: input.hazardId,
        likelihood: input.likelihood,
        impact,
        impactType: usedVI ? "VI_MEAN" : "SEVERITY_FALLBACK",
        score,
        band,
        computedBy: userId,
      },
    });

    // FR-HL-06: mark hazard as VERIFIED after risk score is computed.
    await db.hazardReport.update({
      where: { id: input.hazardId },
      data: { status: "VERIFIED" },
    });

    return { ok: true, scoreId: riskScore.id, score, band };
  } catch (error) {
    console.error("computeRiskScore error:", error);
    return { ok: false, reason: "invalid" };
  }
}

// FR-RS-08: get school risk profile (counts by band, highest R, mean R, by category and zone).
export async function getSchoolRiskProfile(db: Db) {
  const scores = await db.riskScore.findMany({
    include: {
      hazard: {
        include: {
          type: { include: { category: true } },
          zone: true,
        },
      },
    },
  });

  const bandCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  let highestScore = 0;
  let totalScore = 0;

  for (const score of scores) {
    bandCounts[score.band as "LOW" | "MEDIUM" | "HIGH"]++;
    if (score.score > highestScore) highestScore = score.score;
    totalScore += score.score;
  }

  const meanScore = scores.length > 0 ? Math.round((totalScore / scores.length) * 100) / 100 : 0;

  // By category.
  const byCategory: Record<string, number[]> = {};
  for (const score of scores) {
    const categoryName = score.hazard.type.category.name;
    if (!byCategory[categoryName]) byCategory[categoryName] = [];
    byCategory[categoryName].push(score.score);
  }

  // By zone.
  const byZone: Record<string, number[]> = {};
  for (const score of scores) {
    const zoneName = `${score.hazard.zone.building} - ${score.hazard.zone.name}`;
    if (!byZone[zoneName]) byZone[zoneName] = [];
    byZone[zoneName].push(score.score);
  }

  return {
    totalHazards: scores.length,
    bandCounts,
    highestScore,
    meanScore,
    byCategory,
    byZone,
  };
}

// FR-RS-06: check if score is in a specific band.
export function isScoreInBand(score: number, band: "LOW" | "MEDIUM" | "HIGH"): boolean {
  const scoreBand = getRiskBand(score);
  return scoreBand === band;
}
