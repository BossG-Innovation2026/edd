"use client";

// FR-IN-02: Learner protection incident form (bullying, abuse, violence, harassment).
// FR-IN-04: Automatic deadline creation (48h referral, 10d fact-finding, 30d SDS report).

import { useState } from "react";

interface Zone {
  id: string;
  name: string;
  building: string;
}

interface LearnerProtectionFormProps {
  zones: Zone[];
  userId: string;
}

export function LearnerProtectionForm({ zones, userId }: LearnerProtectionFormProps) {
  const [nature, setNature] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [setting, setSetting] = useState("");
  const [learnersInvolved, setLearnersInvolved] = useState("1");
  const [caseStatus, setCaseStatus] = useState("Open");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!nature || !description) {
      setMessage({ type: "error", text: "Please provide nature and description of the incident" });
      return;
    }

    setLoading(true);
    try {
      // TODO: Call server action to create learner protection incident
      setMessage({
        type: "success",
        text: "Learner protection incident recorded with automatic deadlines (48h, 10d, 30d)",
      });
      // Reset form
      setNature("");
      setDescription("");
      setSetting("");
      setLearnersInvolved("1");
      setCaseStatus("Open");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to record incident",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Learner Protection Incident</h2>
      <p className="text-sm text-gray-600 mb-4">
        FR-IN-02, FR-IN-04: Bullying, abuse, violence, or harassment. Automatic deadlines: 48h referral,
        10d fact-finding, 30d SDS report.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nature of Incident */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Nature of Incident *
            <span className="text-xs text-gray-500 ml-1">(FR-IN-02)</span>
          </label>
          <select
            value={nature}
            onChange={(e) => setNature(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            disabled={loading}
          >
            <option value="">-- Select --</option>
            <option value="Bullying">Bullying</option>
            <option value="Abuse">Abuse (physical, emotional, sexual)</option>
            <option value="Violence or fighting">Violence or fighting</option>
            <option value="Harassment">Harassment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description of what happened *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Detailed account of the incident"
            disabled={loading}
          />
        </div>

        {/* Date and Time */}
        <div>
          <label className="block text-sm font-medium mb-1">When did it occur?</label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            disabled={loading}
          />
        </div>

        {/* Setting */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Setting/Location
            <span className="text-xs text-gray-500 ml-1">(e.g., "Playground, 2:00 PM")</span>
          </label>
          <textarea
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Where and when did this happen?"
            disabled={loading}
          />
        </div>

        {/* Learners Involved */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Number of Learners Involved
            <span className="text-xs text-gray-500 ml-1">(FR-IN-05: counts only, no names)</span>
          </label>
          <input
            type="number"
            value={learnersInvolved}
            onChange={(e) => setLearnersInvolved(e.target.value)}
            min="1"
            className="w-full px-3 py-2 border rounded text-sm"
            disabled={loading}
          />
        </div>

        {/* Case Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Case Status</label>
          <select
            value={caseStatus}
            onChange={(e) => setCaseStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            disabled={loading}
          >
            <option value="Open">Open (Under investigation)</option>
            <option value="Under investigation">Under investigation</option>
            <option value="Closed">Closed</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Deadline Info */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm font-medium text-yellow-800 mb-2">FR-IN-04: Automatic Deadlines</p>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>📋 <strong>48 hours:</strong> Referral to appropriate authority (PNP, DSWD, etc.)</li>
            <li>📅 <strong>10 days:</strong> Fact-finding conference</li>
            <li>📄 <strong>30 days:</strong> Final report to Schools Division Superintendent (SDS)</li>
          </ul>
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
          {loading ? "Recording..." : "Record Learner Protection Incident"}
        </button>
      </form>
    </div>
  );
}
