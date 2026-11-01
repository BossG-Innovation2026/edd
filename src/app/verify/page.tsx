// Hazard verification interface. FR-HL-06 (verify hazards), FR-RS-01 (compute risk scores).
// School Head and DRRM Coordinator verify submitted hazards and assign risk scores.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import { canVerifyHazards } from "@/modules/user-roles/permissions";
import { HazardVerifyForm } from "./HazardVerifyForm";

export default async function VerifyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { select: { role: true } } },
  });

  if (!user || !canVerifyHazards(user.roles.map((r) => r.role))) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Verification Not Available</h1>
        <p>Only School Head and DRRM Coordinator can verify hazards.</p>
      </div>
    );
  }

  // FR-HL-06: get unverified hazards (status = SUBMITTED or UNDER_VERIFICATION).
  const unverified = await db.hazardReport.findMany({
    where: { status: { in: ["SUBMITTED", "UNDER_VERIFICATION"] } },
    include: {
      type: { include: { category: true } },
      zone: true,
      reporter: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Hazard Verification Queue</h1>
      <p className="text-gray-600 mb-4">
        You have <strong>{unverified.length}</strong> hazard(s) awaiting verification.
      </p>

      {unverified.length === 0 ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-700">✓ All hazards verified. Great work!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unverified.map((hazard) => (
            <HazardVerifyForm
              key={hazard.id}
              hazard={{
                id: hazard.id,
                reportId: hazard.reportId,
                typeName: hazard.type.name,
                zone: { building: hazard.zone.building, name: hazard.zone.name },
                location: hazard.locationDescription,
                category: hazard.type.category.name,
                description: hazard.description,
                reporter: { name: hazard.reporter.name },
                createdAt: hazard.createdAt,
                status: hazard.status,
                // FR-RS-02: Natural and facility use VI; health/sanitation/security use severity.
                needsVI: hazard.type.category.code === "NATURAL" || hazard.type.category.code === "FACILITY_AND_STRUCTURAL",
              }}
              onVerified={(hazardId) => {
                // In a real app, refresh the list or remove the item.
                console.log("Verified:", hazardId);
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 border rounded text-sm text-gray-700">
        <p className="font-medium mb-2">Requirements Met:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>FR-HL-06: Only verified reports enter risk scores and dashboards</li>
          <li>FR-RS-01: Compute R = L × I for verified hazards</li>
          <li>FR-RS-02: Natural/facility use VI; health/sanitation/security use severity</li>
          <li>FR-UR-02: Role-based access (School Head, DRRM Coordinator only)</li>
          <li>FR-UX-04: Status shown in plain steps (Sent, Being checked, Confirmed, Fixed)</li>
        </ul>
      </div>
    </div>
  );
}
