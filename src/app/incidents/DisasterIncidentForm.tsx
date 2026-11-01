"use client";

// FR-IN-01: Disaster/facility incident form with damage assessment (FR-IN-05: casualty counts).

import { useState } from "react";

interface Zone {
  id: string;
  name: string;
  building: string;
}

interface DisasterIncidentFormProps {
  zones: Zone[];
  userId: string;
}

export function DisasterIncidentForm({ zones, userId }: DisasterIncidentFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [classroomsTotallyDamaged, setClassroomsTotallyDamaged] = useState("0");
  const [classroomsWithMajorDamage, setClassroomsWithMajorDamage] = useState("0");
  const [classroomsWithMinorDamage, setClassroomsWithMinorDamage] = useState("0");
  const [damagedArmchairs, setDamagedArmchairs] = useState("0");
  const [personnelDeceased, setPersonnelDeceased] = useState("0");
  const [personnelInjured, setPersonnelInjured] = useState("0");
  const [personnelMissing, setPersonnelMissing] = useState("0");
  const [personnelDisplaced, setPersonnelDisplaced] = useState("0");
  const [actionsTaken, setActionsTaken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name || zoneIds.length === 0) {
      setMessage({ type: "error", text: "Please provide incident name and select at least one zone" });
      return;
    }

    setLoading(true);
    try {
      // TODO: Call server action to create disaster incident
      setMessage({ type: "success", text: "Disaster incident recorded with IMRS deadline (8 hours)" });
      // Reset form
      setName("");
      setDescription("");
      setZoneIds([]);
      setClassroomsTotallyDamaged("0");
      setClassroomsWithMajorDamage("0");
      setClassroomsWithMinorDamage("0");
      setDamagedArmchairs("0");
      setActionsTaken("");
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
      <h2 className="text-2xl font-semibold mb-4">Disaster/Facility Incident</h2>
      <p className="text-sm text-gray-600 mb-4">FR-IN-01, FR-IN-03: 8-hour IMRS encoding deadline</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Incident Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Incident Name *
            <span className="text-xs text-gray-500 ml-1">(e.g., "Typhoon damage", "Fire")</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Brief description of the incident"
            disabled={loading}
          />
        </div>

        {/* Zones Affected */}
        <div>
          <label className="block text-sm font-medium mb-2">Zones Affected *</label>
          <div className="space-y-2 max-h-48 overflow-auto border rounded p-2">
            {zones.map((zone) => (
              <label key={zone.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={zoneIds.includes(zone.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setZoneIds([...zoneIds, zone.id]);
                    } else {
                      setZoneIds(zoneIds.filter((id) => id !== zone.id));
                    }
                  }}
                  disabled={loading}
                />
                <span className="text-sm">{zone.building} - {zone.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="What happened? When? Details?"
            disabled={loading}
          />
        </div>

        {/* Damage Assessment */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Damage Assessment (FR-IN-05)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Classrooms totally damaged</label>
              <input
                type="number"
                value={classroomsTotallyDamaged}
                onChange={(e) => setClassroomsTotallyDamaged(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Classrooms with major damage</label>
              <input
                type="number"
                value={classroomsWithMajorDamage}
                onChange={(e) => setClassroomsWithMajorDamage(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Classrooms with minor damage</label>
              <input
                type="number"
                value={classroomsWithMinorDamage}
                onChange={(e) => setClassroomsWithMinorDamage(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Armchairs/desks damaged</label>
              <input
                type="number"
                value={damagedArmchairs}
                onChange={(e) => setDamagedArmchairs(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Casualty Counts */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Casualty Counts (FR-IN-05: counts only, no names)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Personnel deceased</label>
              <input
                type="number"
                value={personnelDeceased}
                onChange={(e) => setPersonnelDeceased(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Personnel injured</label>
              <input
                type="number"
                value={personnelInjured}
                onChange={(e) => setPersonnelInjured(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Personnel missing</label>
              <input
                type="number"
                value={personnelMissing}
                onChange={(e) => setPersonnelMissing(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Personnel displaced</label>
              <input
                type="number"
                value={personnelDisplaced}
                onChange={(e) => setPersonnelDisplaced(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Actions Taken */}
        <div>
          <label className="block text-sm font-medium mb-1">Actions Taken</label>
          <textarea
            value={actionsTaken}
            onChange={(e) => setActionsTaken(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="What immediate actions were taken? e.g., 'Assessed damage, blocked off area, provided first aid'"
            disabled={loading}
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
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded text-sm font-medium ${
            loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Recording..." : "Record Disaster Incident"}
        </button>
      </form>
    </div>
  );
}
