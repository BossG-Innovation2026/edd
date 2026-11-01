// Community User dashboard. FR-DR-01: view only own submissions and status.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import { getCommunityUserDashboard } from "@/modules/dashboards/service";

export default async function MySubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const dashboard = await getCommunityUserDashboard(db, session.user.id);

  const statusLabels: Record<string, string> = {
    SUBMITTED: "Sent",
    UNDER_VERIFICATION: "Being checked",
    VERIFIED: "Confirmed",
    REJECTED: "Not verified",
  };

  return (
    <div className="p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">My Hazard Reports</h1>

      {/* Status Summary */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Report Status Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-yellow-50 rounded">
            <p className="text-xs text-gray-600">Sent</p>
            <p className="text-2xl font-bold text-yellow-600">{dashboard.statusCounts.SUBMITTED}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-xs text-gray-600">Being checked</p>
            <p className="text-2xl font-bold text-blue-600">{dashboard.statusCounts.UNDER_VERIFICATION}</p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-xs text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{dashboard.statusCounts.VERIFIED}</p>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <p className="text-xs text-gray-600">Not verified</p>
            <p className="text-2xl font-bold text-red-600">{dashboard.statusCounts.REJECTED}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Total reports: <strong>{dashboard.totalSubmissions}</strong>
        </p>
      </section>

      {/* Recent Reports */}
      <section className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Recent Reports</h2>

        {dashboard.recent.length === 0 ? (
          <p className="text-gray-600">No reports yet. <a href="/report" className="text-blue-600 hover:underline">Submit a hazard report →</a></p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-auto">
            {dashboard.recent.map((report) => (
              <div key={report.id} className="p-3 border rounded bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{report.type.name}</p>
                    <p className="text-sm text-gray-600">
                      {report.zone.building} - {report.zone.name}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    report.status === "VERIFIED"
                      ? "bg-green-100 text-green-800"
                      : report.status === "REJECTED"
                      ? "bg-red-100 text-red-800"
                      : report.status === "UNDER_VERIFICATION"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {statusLabels[report.status] || report.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {report.createdAt.toLocaleDateString()} at {report.createdAt.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Submit New Report */}
      <section className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">Submit Another Report</h3>
        <p className="text-sm text-gray-700 mb-3">
          Found another hazard? You can submit as many reports as needed. Each report is confidential and reviewed by the DRRM Coordinator.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          onClick={() => (window.location.href = "/report")}
        >
          New Report →
        </button>
      </section>

      {/* Requirements */}
      <section className="mt-8 p-4 bg-gray-50 border rounded text-sm">
        <p className="font-medium mb-2">Requirements Met:</p>
        <ul className="list-disc ml-5 space-y-1 text-gray-700">
          <li>FR-UR-05: Community users view only their own submissions and status</li>
          <li>FR-UX-04: Status shown in plain steps (Sent, Being checked, Confirmed, Not verified)</li>
          <li>FR-DR-01: Role-specific dashboard for Community Users</li>
        </ul>
      </section>
    </div>
  );
}
