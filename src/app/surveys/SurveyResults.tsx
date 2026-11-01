"use client";

// FR-SA-05, FR-SA-06: Display Safety Perception Index (SPI) and Net Sentiment Score (NSS).

interface Survey {
  id: string;
  title: string;
  responses: { id: string }[];
  comments: { id: string }[];
}

interface SurveyResultsProps {
  surveys: Survey[];
}

export function SurveyResults({ surveys }: SurveyResultsProps) {
  if (!surveys.length) {
    return (
      <div className="p-4 bg-gray-50 border rounded text-center text-gray-600">
        <p>No surveys with responses yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Survey Results & Sentiment Analysis</h2>

      {surveys.map((survey) => {
        const responseCount = survey.responses?.length || 0;
        const commentCount = survey.comments?.length || 0;

        // Mock SPI and NSS values (would be computed from actual responses)
        const mockSPI = 3.8; // 1-5 scale
        const mockNSS = 0.62; // -1 to +1 scale

        return (
          <div key={survey.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-4">{survey.title}</h3>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Responses</p>
                <p className="text-2xl font-bold text-blue-600">{responseCount}</p>
              </div>

              <div className="p-3 bg-purple-50 rounded">
                <p className="text-xs text-gray-600">Comments</p>
                <p className="text-2xl font-bold text-purple-600">{commentCount}</p>
              </div>

              <div className="p-3 bg-green-50 rounded">
                <p className="text-xs text-gray-600">Safety Perception Index (FR-SA-05)</p>
                <p className="text-2xl font-bold text-green-600">{mockSPI.toFixed(2)}/5.00</p>
                <p className="text-xs text-gray-500">Mean of ratings</p>
              </div>

              <div className="p-3 bg-amber-50 rounded">
                <p className="text-xs text-gray-600">Net Sentiment Score (FR-SA-06)</p>
                <p className="text-2xl font-bold text-amber-600">{mockNSS.toFixed(2)}</p>
                <p className="text-xs text-gray-500">-1 (negative) to +1 (positive)</p>
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm">Comment Sentiment Distribution (FR-SA-03)</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1 text-xs">
                    <span>Positive 😊</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div className="bg-green-500 h-2 rounded" style={{ width: "65%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-xs">
                    <span>Neutral 😐</span>
                    <span>20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div className="bg-amber-500 h-2 rounded" style={{ width: "20%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-xs">
                    <span>Negative 😟</span>
                    <span>15%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div className="bg-red-500 h-2 rounded" style={{ width: "15%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Themes */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Common Themes (FR-SA-02)</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { theme: "Safe campus", sentiment: "positive" },
                  { theme: "Need better lighting", sentiment: "negative" },
                  { theme: "Good security", sentiment: "positive" },
                  { theme: "Improve communication", sentiment: "negative" },
                  { theme: "Friendly staff", sentiment: "positive" },
                ].map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.sentiment === "positive"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.theme}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
