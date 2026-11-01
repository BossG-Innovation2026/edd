// DRRM Coordinator dashboard. FR-DR-01: role-specific views.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import { getDRRMCoordinatorDashboard } from "@/modules/dashboards/service";

export default async function CoordinatorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { select: { role: true } } },
  });

  const roles = user?.roles.map((r) => r.role) ?? [];
  if (!roles.includes("DRRM_COORDINATOR")) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>This dashboard is for DRRM Coordinators only.</p>
      </div>
    );
  }

  const dashboard = await getDRRMCoordinatorDashboard(db);

  return (
    <div className="p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">DRRM Coordinator Dashboard</h1>

      {/* Verification Queue */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
          Verification Queue
        </h2>
        <p className="text-lg font-bold text-yellow-600 mb-3">
          {dashboard.verificationQueue} hazard(s) awaiting verification
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => (window.location.href = "/verify")}
        >
          Go to Verification →
        </button>
      </section>

      {/* Inspection & Expiry Alerts */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
          Inspection & Expiry Alerts (FR-AV-06)
        </h2>
        <p className="text-lg font-bold text-orange-600 mb-3">
          {dashboard.upcomingAlerts} asset(s) need attention in the next 14 days
        </p>
        {dashboard.nextInspections.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-auto">
            {dashboard.nextInspections.map((asset) => (
              <div key={asset.id} className="p-2 bg-orange-50 rounded text-sm">
                <p>
                  <strong>{asset.name}</strong> - {asset.zone.name}
                </p>
                <p className="text-xs text-gray-600">
                  Service/Expiry: {asset.nextServiceAt?.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Manual Review Queue */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
          Manual Sentiment Review Queue (FR-SA-12)
        </h2>
        <p className="text-lg font-bold text-purple-600 mb-3">
          {dashboard.manualReviewQueue} comment(s) awaiting manual review
        </p>
        <p className="text-sm text-gray-600">
          Comments with &lt; 2 matched words or regional languages (Kapampangan, Ilocano, Sambal)
          require manual review. Deadline: within 48 hours.
        </p>
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

      {/* Requirements */}
      <section className="p-4 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-medium mb-2">Module 3.5 Dashboard Requirements (FR-DR-01):</p>
        <ul className="list-disc ml-5 space-y-1 text-gray-700">
          <li>Verification queue - hazards awaiting verification</li>
          <li>Inspection and expiry alerts - assets needing attention (FR-AV-06)</li>
          <li>Manual review queue - comments awaiting manual review (FR-SA-12)</li>
          <li>School Head's risk and asset views (shared with DRRM Coordinator)</li>
          <li>Role-based access control enforced (FR-UR-02)</li>
        </ul>
      </section>
    </div>
  );
}
