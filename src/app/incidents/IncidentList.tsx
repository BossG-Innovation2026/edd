"use client";

// Display list of recent incidents with deadline tracking.

interface IncidentDeadline {
  id: string;
  incidentId: string;
  deadlineType: string;
  dueAt: Date;
  completedAt: Date | null;
}

interface IncidentReport {
  id: string;
  name: string;
  description: string;
  isLearnerProtection: boolean;
  learnersInvolved: number | null;
  caseStatus: string | null;
  createdAt: Date;
  deadlines: IncidentDeadline[];
}

interface IncidentWithDeadlines extends IncidentReport {
  deadlines: IncidentDeadline[];
}

interface IncidentListProps {
  incidents: IncidentWithDeadlines[];
}

export function IncidentList({ incidents }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border rounded text-center text-gray-600">
        <p>No incidents recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Recent Incidents</h2>

      {incidents.map((incident) => {
        const overdueDeadlines = incident.deadlines.filter(
          (d) => d.dueAt < new Date() && !d.completedAt
        );
        const upcomingDeadlines = incident.deadlines.filter(
          (d) => d.dueAt >= new Date() && !d.completedAt
        );

        return (
          <div key={incident.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">
                  {incident.isLearnerProtection ? "🛡️ Learner Protection" : "🚨 Disaster/Facility"}
                </h3>
                <p className="text-sm text-gray-600">{incident.name}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  incident.caseStatus === "Closed" || incident.caseStatus === "Resolved"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {incident.caseStatus || "Open"}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-3">{incident.description}</p>

            {/* Deadlines */}
            {incident.deadlines.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold text-gray-600 mb-2">FR-IN-04: Deadlines</p>
                <div className="space-y-1">
                  {overdueDeadlines.length > 0 && (
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-xs font-medium text-red-800">🔴 OVERDUE</p>
                      {overdueDeadlines.map((d) => (
                        <p key={d.id} className="text-xs text-red-700">
                          {d.deadlineType}: Due {d.dueAt.toLocaleDateString()}
                        </p>
                      ))}
                    </div>
                  )}

                  {upcomingDeadlines.length > 0 && (
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-xs font-medium text-yellow-800">⏰ Upcoming</p>
                      {upcomingDeadlines.map((d) => {
                        const daysLeft = Math.ceil(
                          (d.dueAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <p key={d.id} className="text-xs text-yellow-700">
                            {d.deadlineType}: {daysLeft} days left ({d.dueAt.toLocaleDateString()})
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {incident.deadlines.filter((d) => d.completedAt).length > 0 && (
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-xs font-medium text-green-800">✓ Completed</p>
                      {incident.deadlines
                        .filter((d) => d.completedAt)
                        .map((d) => (
                          <p key={d.id} className="text-xs text-green-700">
                            {d.deadlineType}: Completed {d.completedAt?.toLocaleDateString()}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Reported {incident.createdAt.toLocaleDateString()} at{" "}
              {incident.createdAt.toLocaleTimeString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
