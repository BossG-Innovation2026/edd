// Sentiment Survey interface. Module 3.4: FR-SA-01 to FR-SA-12.
// Collect school safety perception through surveys and analyze community sentiment.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPrismaClient } from "@/lib/db";
import { SurveyForm } from "./SurveyForm";
import { SurveyResults } from "./SurveyResults";
import { ManualReviewQueue } from "./ManualReviewQueue";

export default async function SurveysPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return redirect("/login");

  const db = createPrismaClient(process.env.DATABASE_URL!);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { roles: { select: { role: true } } },
  });

  const roles = user?.roles.map((r) => r.role) ?? [];
  const isVerifier = roles.includes("SCHOOL_HEAD") || roles.includes("DRRM_COORDINATOR");
  const canRespond = !roles.includes("SYSTEM_ADMINISTRATOR");

  // Get recent surveys
  const surveys = (await db.survey.findMany({
    include: {
      responses: { select: { id: true } },
      comments: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })) as any[];

  // Get manual review queue if user is verifier
  const manualReviewComments = isVerifier
    ? ((await db.surveyComment.findMany({
        where: { inManualReview: true, reviewedAt: null },
        include: { survey: true },
        take: 10,
      })) as any[])
    : [];

  return (
    <div className="p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Safety Perception & Sentiment Survey</h1>
      <p className="text-gray-600 mb-6">
        Module 3.4: Collect community feedback on school safety. Safety Perception Index (SPI) and Net
        Sentiment Score (NSS) track sentiment trends.
      </p>

      {/* Tabs */}
      <div className="survey-tabs mb-6">
        <input type="radio" id="tab-respond" name="survey-tab" defaultChecked={canRespond} />
        <label htmlFor="tab-respond">Respond to Survey</label>

        {isVerifier && (
          <>
            <input type="radio" id="tab-results" name="survey-tab" />
            <label htmlFor="tab-results">Results & Analysis</label>

            <input type="radio" id="tab-review" name="survey-tab" />
            <label htmlFor="tab-review">Manual Review Queue</label>
          </>
        )}
      </div>

      {/* Respond to Survey */}
      <div className="tab-content">
        {surveys.length > 0 ? (
          surveys.map((survey) => (
            <SurveyForm key={survey.id} survey={survey} userId={user!.id} />
          ))
        ) : (
          <div className="p-4 bg-gray-50 border rounded text-center text-gray-600">
            <p>No active surveys at this time.</p>
          </div>
        )}
      </div>

      {/* Results & Analysis */}
      {isVerifier && (
        <div className="tab-content">
          <SurveyResults surveys={surveys} />
        </div>
      )}

      {/* Manual Review Queue */}
      {isVerifier && (
        <div className="tab-content">
          <ManualReviewQueue comments={manualReviewComments} />
        </div>
      )}

      {/* Requirements */}
      <section className="p-4 bg-blue-50 border border-blue-200 rounded text-sm mt-6">
        <p className="font-medium mb-2">Module 3.4 Sentiment Analysis Requirements:</p>
        <ul className="list-disc ml-5 space-y-1 text-gray-700">
          <li>FR-SA-01: Create survey with Likert scale items (1-5 rating)</li>
          <li>FR-SA-02: Multi-language support (English, Filipino/Tagalog)</li>
          <li>FR-SA-03: Sentiment analysis of open-ended comments (lexicon-based)</li>
          <li>FR-SA-04: Language detection for comments</li>
          <li>FR-SA-05: Safety Perception Index (SPI) = mean of rating items</li>
          <li>FR-SA-06: Net Sentiment Score (NSS) = (P - N) / (P + Neu + N)</li>
          <li>FR-SA-12: Manual review queue for ambiguous comments</li>
        </ul>
      </section>
    </div>
  );
}
