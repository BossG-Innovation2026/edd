// Module 3.3 server actions. FR-RS-01 to FR-RS-09: risk scoring with role checks.
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import { canVerifyHazards } from "@/modules/user-roles/permissions";
import { computeRiskScore } from "./service";
import type { ComputeRiskScoreInput } from "./service";

// FR-RS-01: verifier (School Head or DRRM Coordinator) computes risk score for a verified hazard.
export async function computeRiskScoreAction(
  input: ComputeRiskScoreInput
): Promise<{ ok: boolean; score?: number; band?: string; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

  const db = createPrismaClient(process.env.DATABASE_URL!);
  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { roles: { select: { role: true } } },
    });

    if (!user || !canVerifyHazards(user.roles.map((r) => r.role))) {
      return { ok: false, error: "Only School Head and DRRM Coordinator can verify hazards and compute risk scores." };
    }

    const result = await computeRiskScore(db, input, user.id);

    if (!result.ok) {
      return { ok: false, error: result.errors?.likelihood || result.errors?.severity || "Failed to compute risk score" };
    }

    return { ok: true, score: result.score, band: result.band };
  } finally {
    await db.$disconnect();
  }
}
