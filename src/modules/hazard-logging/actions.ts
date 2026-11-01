"use server";

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { submitHazardReport, type SubmitResult } from "./service";

// FR-HL-01: server action behind the report form. Identity comes from the session, never the form.
export async function submitHazardReportAction(input: unknown): Promise<SubmitResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "not_allowed", message: "Please log in again." };
  return submitHazardReport(getDb(), user, input);
}
