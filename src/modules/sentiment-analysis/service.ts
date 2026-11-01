// Module 3.4: Community Sentiment and Feeling Analysis service.
// FR-SA-01 to FR-SA-13: survey scheduling, comment labeling, SPI/NSS computation.

import type { Db } from "@/lib/db";
import { analyzeSentiment, detectLanguage } from "./lexicon";

export interface CreateSurveyInput {
  title: string;
  description?: string;
  items: Array<{ id: string; text: string; reverseScore?: boolean }>;
  scheduledFor: Date;
}

export interface CreateSurveyResult {
  ok: boolean;
  surveyId?: string;
  error?: string;
}

// FR-SA-01: DRRM Coordinator schedules survey.
export async function createSurvey(db: Db, input: CreateSurveyInput, createdBy: string): Promise<CreateSurveyResult> {
  try {
    const survey = await db.survey.create({
      data: {
        title: input.title,
        description: input.description,
        items: JSON.stringify(input.items),
        scheduledFor: input.scheduledFor,
        createdBy,
      },
    });
    return { ok: true, surveyId: survey.id };
  } catch (error) {
    console.error("createSurvey error:", error);
    return { ok: false, error: "Failed to create survey" };
  }
}

// FR-SA-03, FR-SA-04: analyze comment for sentiment and language.
export async function labelComment(
  db: Db,
  text: string
): Promise<{
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  feeling?: string;
  language: string;
  inManualReview: boolean;
}> {
  const { sentiment, feeling, matchedWords } = analyzeSentiment(text);
  const language = detectLanguage(text);

  // FR-SA-12: comments with < 2 matched words or regional languages go to manual review.
  const inManualReview = matchedWords < 2 || !["en", "fil", "tl"].includes(language);

  return { sentiment, feeling, language, inManualReview };
}

// FR-SA-02, FR-SA-06: compute SPI and NSS indices.
export async function computeSurveyMetrics(
  db: Db,
  surveyId: string
): Promise<{ spi?: number; nss?: number; positiveCount: number; neutralCount: number; negativeCount: number }> {
  const responses = await db.surveyResponse.findMany({ where: { surveyId } });
  const comments = await db.surveyComment.findMany({ where: { surveyId } });

  // FR-SA-02: SPI = mean of survey items (after reverse-scoring negative items).
  let totalScore = 0;
  let ratingCount = 0;

  for (const response of responses) {
    const answers = JSON.parse(response.answers);
    const survey = await db.survey.findUnique({ where: { id: surveyId } });
    const items = JSON.parse(survey?.items ?? "[]");

    for (const item of items) {
      const answer = answers[item.id];
      if (answer) {
        const score = item.reverseScore ? 6 - answer : answer; // Reverse-score if needed.
        totalScore += score;
        ratingCount++;
      }
    }
  }

  const spi = ratingCount > 0 ? Math.round((totalScore / ratingCount) * 100) / 100 : undefined;

  // FR-SA-06: NSS = (P - N) / (P + Neu + N).
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;

  for (const comment of comments) {
    if (comment.confirmedSentiment) {
      if (comment.confirmedSentiment === "POSITIVE") positiveCount++;
      else if (comment.confirmedSentiment === "NEUTRAL") neutralCount++;
      else if (comment.confirmedSentiment === "NEGATIVE") negativeCount++;
    }
  }

  const total = positiveCount + neutralCount + negativeCount;
  const nss = total > 0 ? Math.round(((positiveCount - negativeCount) / total) * 100) / 100 : undefined;

  return { spi, nss, positiveCount, neutralCount, negativeCount };
}

// FR-SA-07: get survey metrics (SPI, NSS trends).
export async function getSurveyMetrics(db: Db, surveyId: string) {
  return db.surveyMetrics.findUnique({ where: { surveyId } });
}
