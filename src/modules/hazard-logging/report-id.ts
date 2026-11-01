// Section 3.1 record field "Report ID": issued as HZ-<year>-<5-digit sequence>, e.g. HZ-2026-00001.
import type { Prisma } from "@/generated/prisma/client";

export const REPORT_ID_PATTERN = /^HZ-\d{4}-\d{5,}$/;

export function formatReportId(year: number, sequence: number): string {
  return `HZ-${year}-${String(sequence).padStart(5, "0")}`;
}

// Must run inside the transaction that creates the report, so two reports never share an ID.
export async function nextReportId(tx: Prisma.TransactionClient, now: Date): Promise<string> {
  const year = now.getFullYear();
  const counter = await tx.reportCounter.upsert({
    where: { year },
    update: { last: { increment: 1 } },
    create: { year, last: 1 },
  });
  return formatReportId(year, counter.last);
}
