import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { submitHazardReportAction } from "@/modules/hazard-logging/actions";
import { HazardReportForm } from "@/modules/hazard-logging/components/HazardReportForm";
import { loadReportFormOptions } from "@/modules/hazard-logging/service";
import { canSubmitHazardReport } from "@/modules/user-roles/permissions";

export const dynamic = "force-dynamic";

// FR-HL-01 / FR-UX-01: the hazard report page.
export default async function ReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.active) {
    return <Notice title="Account not active yet" text="The School Head must approve your account before you can send reports." />;
  }
  if (!canSubmitHazardReport(user.roles)) {
    return <Notice title="Reports not available" text="Your role cannot submit hazard reports." />;
  }

  const options = await loadReportFormOptions(getDb());
  return (
    <>
      <h1>Report a hazard</h1>
      <HazardReportForm options={options} onSubmit={submitHazardReportAction} />
    </>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
