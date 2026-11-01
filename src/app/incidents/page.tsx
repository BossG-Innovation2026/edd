// Incident Reporting interface. Module 3.6: FR-IN-01 to FR-IN-08.
// School Head records disaster/facility and learner protection incidents with automatic deadline tracking.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import { DisasterIncidentForm } from "./DisasterIncidentForm";
import { LearnerProtectionForm } from "./LearnerProtectionForm";
import { IncidentList } from "./IncidentList";

export default async function IncidentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { select: { role: true } } },
  });

  const roles = user?.roles.map((r) => r.role) ?? [];
  // Only School Head and DRRM Coordinator can report incidents
  if (!roles.includes("SCHOOL_HEAD") && !roles.includes("DRRM_COORDINATOR")) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>Only School Heads and DRRM Coordinators can report incidents.</p>
      </div>
    );
  }

  // Get zones for forms
  const zones = await db.zone.findMany({
    orderBy: { name: "asc" },
  });

  // Get recent incidents
  const incidents = (await db.incidentReport.findMany({
    include: { deadlines: true },
    orderBy: { occurredAt: "desc" },
    take: 10,
  })) as any;

  return (
    <div className="p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Incident Reporting</h1>
      <p className="text-gray-600 mb-6">
        Module 3.6: Report disaster/facility incidents (8-hour IMRS deadline) and learner protection incidents
        (with referral, fact-finding, and SDS report deadlines).
      </p>

      {/* Tabs for incident types */}
      <div className="incident-tabs mb-6">
        <input type="radio" id="tab-disaster" name="incident-type" defaultChecked />
        <label htmlFor="tab-disaster">Disaster/Facility</label>

        <input type="radio" id="tab-learner" name="incident-type" />
        <label htmlFor="tab-learner">Learner Protection</label>

        <input type="radio" id="tab-list" name="incident-type" />
        <label htmlFor="tab-list">Recent Incidents</label>
      </div>

      {/* Disaster Incident Form */}
      <div className="tab-content">
        <DisasterIncidentForm zones={zones} userId={user!.id} />
      </div>

      {/* Learner Protection Form */}
      <div className="tab-content">
        <LearnerProtectionForm zones={zones} userId={user!.id} />
      </div>

      {/* Incident List */}
      <div className="tab-content">
        <IncidentList incidents={incidents} />
      </div>

      {/* Requirements */}
      <section className="p-4 bg-blue-50 border border-blue-200 rounded text-sm mt-6">
        <p className="font-medium mb-2">Module 3.6 Incident Reporting Requirements:</p>
        <ul className="list-disc ml-5 space-y-1 text-gray-700">
          <li>FR-IN-01: Disaster/facility incident recording with damage data (classroom count, furniture)</li>
          <li>FR-IN-02: Learner protection incident recording (bullying, violence, harassment)</li>
          <li>FR-IN-03: IMRS encoding deadline (8 hours from disaster incident)</li>
          <li>FR-IN-04: Learner protection deadlines (48h referral, 10d fact-finding, 30d SDS report)</li>
          <li>FR-IN-05: Personnel casualty counts (deceased, injured, missing, displaced)</li>
          <li>FR-IN-06: Class suspension and resumption tracking</li>
          <li>FR-IN-07: Automatic deadline calculation and alert system</li>
          <li>FR-IN-08: Learner Reference Number protection (optional with consent)</li>
        </ul>
      </section>
    </div>
  );
}
