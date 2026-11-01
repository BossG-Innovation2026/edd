"use client";

// FR-SA-01: Survey response form with Likert scale (1-5) and open-ended comments.

import { useState } from "react";

interface SurveyQuestion {
  id: string;
  text: string;
  isReverse?: boolean;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

interface SurveyFormProps {
  survey: Survey;
  userId: string;
}

export function SurveyForm({ survey, userId }: SurveyFormProps) {
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRatingChange = (questionId: string, value: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate all questions answered
    if (survey.questions.length > 0 && Object.keys(responses).length !== survey.questions.length) {
      setMessage({ type: "error", text: "Please answer all questions" });
      return;
    }

    setLoading(true);
    try {
      // TODO: Call server action to save survey response
      setMessage({ type: "success", text: "Thank you! Your response has been recorded." });
      setResponses({});
      setComments("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save response",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm mb-4">
      <h2 className="text-xl font-semibold mb-2">{survey.title}</h2>
      <p className="text-gray-600 mb-4">{survey.description}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Likert Scale Questions */}
        {survey.questions?.map((q) => (
          <div key={q.id} className="border-b pb-4">
            <p className="font-medium mb-3 text-sm">{q.text}</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleRatingChange(q.id, val)}
                  className={`w-12 h-12 rounded border-2 font-medium transition ${
                    responses[q.id] === val
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-300 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
          </div>
        ))}

        {/* Open-ended Comments */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Additional Comments (FR-SA-03: sentiment analysis)
            <span className="text-xs text-gray-500 ml-1">Optional - your thoughts on school safety</span>
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Share any concerns or positive experiences related to school safety..."
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Comments may be analyzed for sentiment and language. Some comments may require manual
            review.
          </p>
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
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded text-sm font-medium ${
            loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit Response"}
        </button>
      </form>
    </div>
  );
}
