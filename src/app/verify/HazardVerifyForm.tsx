"use client";

import { useState } from "react";
import { computeRiskScoreAction, rejectHazardAction } from "@/modules/risk-scoring/actions";

interface HazardCardProps {
  id: string;
  reportId: string;
  typeName: string;
  zone: { building: string; name: string };
  location: string;
  category: string;
  description: string;
  reporter: { name: string };
  createdAt: Date;
  status: string;
  // True if hazard is natural/facility (needs VI); false if health/sanitation/security (needs severity).
  needsVI: boolean;
}

export function HazardVerifyForm({
  hazard,
  onVerified,
}: {
  hazard: HazardCardProps;
  onVerified: (hazardId: string) => void;
}) {
  const [likelihood, setLikelihood] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; band: string } | null>(null);
  const [error, setError] = useState<string>("");

  const handleVerify = async () => {
    setError("");
    setResult(null);

    // Validate likelihood
    if (!likelihood) {
      setError("Please select likelihood (1-5)");
      return;
    }

    const L = parseInt(likelihood);
    if (isNaN(L) || L < 1 || L > 5) {
      setError("Likelihood must be 1-5");
      return;
    }

    // Validate severity if hazard needs it
    let S: number | undefined;
    if (!hazard.needsVI) {
      if (!severity) {
        setError("Please select severity (1-5) for this hazard type");
        return;
      }
      S = parseInt(severity);
      if (isNaN(S) || S < 1 || S > 5) {
        setError("Severity must be 1-5");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await computeRiskScoreAction({
        hazardId: hazard.id,
        likelihood: L,
        severity: S,
      });

      if (res.ok && res.score !== undefined && res.band) {
        setResult({ score: res.score, band: res.band });
        onVerified(hazard.id);
      } else {
        setError(res.error || "Failed to compute risk score");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setError("");
    setResult(null);

    setLoading(true);
    try {
      const res = await rejectHazardAction(hazard.id);

      if (res.ok) {
        onVerified(hazard.id);
      } else {
        setError(res.error || "Failed to reject hazard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-lg font-semibold">{hazard.typeName}</h2>
          <p className="text-sm text-gray-600">
            {hazard.zone.building} - {hazard.zone.name}
          </p>
        </div>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
          {hazard.status}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium">Location: {hazard.location}</p>
        <p className="text-sm font-medium">Category: {hazard.category}</p>
        <p className="text-sm mt-2">
          <strong>Description:</strong> {hazard.description}
        </p>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        <p>Reported by: {hazard.reporter.name}</p>
        <p>Reported at: {hazard.createdAt.toLocaleString()}</p>
      </div>

      {/* Verification Form */}
      {!result && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-3">
          <p className="text-sm font-medium mb-2">Assign Risk Score</p>

          {/* Likelihood */}
          <div className="mb-3">
            <label className="text-sm font-medium">
              Likelihood (1-5): How likely is this hazard?
            </label>
            <div className="flex gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((l) => (
                <button
                  key={l}
                  onClick={() => setLikelihood(String(l))}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    likelihood === String(l)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Severity (if needed) */}
          {!hazard.needsVI && (
            <div className="mb-3">
              <label className="text-sm font-medium">
                Severity (1-5): What is the potential impact?
              </label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(String(s))}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      severity === String(s)
                        ? "bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="p-3 bg-green-50 border border-green-200 rounded mb-3">
          <p className="text-green-800 font-medium">✓ Risk Score Computed</p>
          <p className="text-sm text-green-700">
            Score: <strong>{result.score.toFixed(2)}</strong> ({result.band})
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={handleVerify}
          disabled={loading || !!result}
          className={`px-4 py-2 rounded text-sm font-medium ${
            result
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {loading ? "Computing..." : "Verify & Score"}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
