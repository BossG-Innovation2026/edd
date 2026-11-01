// School Head dashboard. FR-DR-01 & FR-UX-03: role-specific views with school map showing risk bands.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import { getSchoolHeadDashboard } from "@/modules/dashboards/service";
import { getRiskBand } from "@/modules/risk-scoring/service";
import { SchoolMap } from "./SchoolMap";

export default async function SchoolHeadDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { select: { role: true } } },
  });

  const roles = user?.roles.map((r) => r.role) ?? [];
  if (!roles.includes("SCHOOL_HEAD")) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>This dashboard is for School Heads only.</p>
      </div>
    );
  }

  const dashboard = await getSchoolHeadDashboard(db);

  // FR-UX-03: Compute risk profile for each zone for the school map.
  const zones = await db.zone.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const zoneRiskProfiles = await Promise.all(
    zones.map(async (zone) => {
      const zoneScores = await db.riskScore.findMany({
        where: { hazard: { zoneId: zone.id } },
        select: { score: true },
      });

      const meanScore = zoneScores.length > 0
        ? zoneScores.reduce((sum, s) => sum + s.score, 0) / zoneScores.length
        : 0;

      return {
        id: zone.id,
        name: zone.name,
        building: zone.building,
        riskProfile: {
          meanScore: Math.round(meanScore * 100) / 100,
          band: getRiskBand(meanScore),
          hazardCount: zoneScores.length,
        },
      };
    })
  );

  return (
    <div className="p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">School Safety Map</h1>
      <p className="text-gray-600 mb-4">
        FR-UX-03: Click on any zone to see detailed risk information. Colors show risk bands:
        <strong style={{ color: "#dc2626" }}> Red = High</strong>,
        <strong style={{ color: "#eab308" }}> Yellow = Medium</strong>,
        <strong style={{ color: "#16a34a" }}> Green = Low</strong>.
      </p>

      {/* FR-UX-03: School map with zones shaded by risk band */}
      <section className="mb-8">
        <SchoolMap
          zones={zoneRiskProfiles}
          onZoneSelect={(zoneId) => {
            // Handler for zone selection (already handled in SchoolMap component)
            console.log("Selected zone:", zoneId);
          }}
        />
      </section>

      {/* Risk Profile Summary */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">School Risk Profile</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-red-50 rounded">
            <p className="text-sm text-gray-600">High Risk</p>
            <p className="text-2xl font-bold text-red-600">{dashboard.riskProfile.bandCounts.HIGH}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded">
            <p className="text-sm text-gray-600">Medium Risk</p>
            <p className="text-2xl font-bold text-yellow-600">{dashboard.riskProfile.bandCounts.MEDIUM}</p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-sm text-gray-600">Low Risk</p>
            <p className="text-2xl font-bold text-green-600">{dashboard.riskProfile.bandCounts.LOW}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Hazards</p>
            <p className="text-xl font-bold">{dashboard.riskProfile.totalHazards}</p>
          </div>
          <div>
            <p className="text-gray-600">Mean Risk Score</p>
            <p className="text-xl font-bold">{dashboard.riskProfile.meanScore.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* High-Band Hazards */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <span className="inline-block w-3 h-3 bg-red-600 rounded-full mr-2"></span>
          High-Risk Hazards Requiring Attention
        </h2>
        <p className="text-lg font-bold text-red-600 mb-3">
          {dashboard.highBandHazards} hazard(s) in High risk band
        </p>
        {dashboard.hazardTrend.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-auto">
            {dashboard.hazardTrend.map((score) => (
              <div key={score.id} className="p-3 bg-red-50 rounded border border-red-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{score.hazard.type.name}</p>
                    <p className="text-sm text-gray-600">
                      {score.hazard.zone.building} - {score.hazard.zone.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{score.hazard.type.category.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{score.score.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{score.band}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          onClick={() => (window.location.href = "/coordinator-dashboard")}
        >
          Review All Hazards →
        </button>
      </section>

      {/* High-Band Assets */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <span className="inline-block w-3 h-3 bg-orange-600 rounded-full mr-2"></span>
          High-Vulnerability Assets
        </h2>
        <p className="text-lg font-bold text-orange-600 mb-3">
          {dashboard.highBandAssets} asset(s) with VI ≥ 3.81 (High)
        </p>
        <p className="text-sm text-gray-600 mb-3">
          These assets need maintenance or replacement priority.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          onClick={() => (window.location.href = "/assets")}
        >
          Manage Assets →
        </button>
      </section>

      {/* Open Mitigations */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Ongoing Mitigation Actions</h2>
        <p className="text-lg font-bold text-blue-600 mb-3">
          {dashboard.openMitigations} action(s) in progress
        </p>
        <p className="text-sm text-gray-600">
          Mitigations are tracked from hazard verification through resolution.
        </p>
      </section>

      {/* Requirements */}
      <section className="p-4 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-medium mb-2">School Head Dashboard Requirements (FR-DR-01):</p>
        <ul className="list-disc ml-5 space-y-1 text-gray-700">
          <li>School risk profile with HIGH/MEDIUM/LOW band counts (FR-RS-05)</li>
          <li>High-risk hazards requiring attention (top 3-5 by score)</li>
          <li>High-vulnerability assets (VI ≥ 3.81)</li>
          <li>Open mitigation actions in progress</li>
          <li>Role-based access control enforced (FR-UR-02)</li>
        </ul>
      </section>
    </div>
  );
}
