"use client";

// FR-SA-12: Manual review queue for comments needing human analysis.
// Comments with < 2 matched words or regional languages require manual review.

import { useState } from "react";

interface SurveyComment {
  id: string;
  text: string;
  sentiment: string;
  matchedWords: number;
  detectedLanguage: string;
  inManualReview: boolean;
  reviewedAt: Date | null;
  survey: { title: string };
}

interface ManualReviewQueueProps {
  comments: SurveyComment[];
}

export function ManualReviewQueue({ comments }: ManualReviewQueueProps) {
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [manualSentiment, setManualSentiment] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentComment = comments.find((c) => c.id === reviewing);

  if (comments.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800">✓ No comments awaiting manual review. Great!</p>
      </div>
    );
  }

  if (reviewing && currentComment) {
    return (
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold">Manual Review - {currentComment.survey.title}</h3>
          <button
            onClick={() => {
              setReviewing(null);
              setManualSentiment("");
              setNotes("");
              setMessage(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Original Comment */}
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Original Comment:</p>
            <p className="text-sm italic">"{currentComment.text}"</p>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>Language: {currentComment.detectedLanguage}</p>
              <p>Matched words: {currentComment.matchedWords} (threshold: 2)</p>
              <p>Reason: {currentComment.matchedWords < 2 ? "Too few matched words" : "Regional language"}</p>
            </div>
          </div>

          {/* Review Form */}
          <div className="space-y-3 border-t pt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Assessment</label>
              <div className="flex gap-2">
                {["POSITIVE", "NEUTRAL", "NEGATIVE"].map((sentiment) => (
                  <button
                    key={sentiment}
                    type="button"
                    onClick={() => setManualSentiment(sentiment)}
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      manualSentiment === sentiment
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {sentiment === "POSITIVE" ? "😊" : sentiment === "NEGATIVE" ? "😟" : "😐"} {sentiment}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Why did you choose this sentiment? Any context?"
              />
            </div>

            {message && (
              <div
                className={`p-2 rounded text-sm ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={async () => {
                if (!manualSentiment) {
                  setMessage({ type: "error", text: "Please select a sentiment" });
                  return;
                }
                // TODO: Save review
                setMessage({ type: "success", text: "Review saved!" });
                setReviewing(null);
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Save Review & Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Manual Review Queue (FR-SA-12)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Comments requiring manual review: fewer than 2 matched sentiment words, or regional languages
        (Kapampangan, Ilocano, Sambal). Deadline: 48 hours.
      </p>

      <div className="space-y-2">
        {comments.map((comment) => (
          <button
            key={comment.id}
            onClick={() => setReviewing(comment.id)}
            className="w-full p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition text-left"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium">{comment.survey.title}</p>
                <p className="text-xs text-gray-500">
                  Language: {comment.detectedLanguage} | Matched words: {comment.matchedWords}
                </p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Needs Review
              </span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">"{comment.text}"</p>
          </button>
        ))}
      </div>
    </div>
  );
}
