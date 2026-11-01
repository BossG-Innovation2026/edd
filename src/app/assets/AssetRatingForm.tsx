"use client";

import { useState } from "react";
import { rateAssetAction } from "@/modules/asset-vulnerability/actions";

interface Asset {
  id: string;
  name: string;
  categoryId: string;
  zoneId: string;
  quantity: number;
  dateAcquired: Date | null;
  lastInspectionAt: Date | null;
  nextServiceAt: Date | null;
  safeguardsInPlace: string | null;
  responsiblePerson: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AssetCategory {
  id: string;
  name: string;
  code: string;
}

interface Zone {
  id: string;
  name: string;
  building: string;
}

interface AssetRating {
  id: string;
  assetId: string;
  physicalCondition: number;
  exposure: number;
  criticality: number;
  adaptiveCapacityGap: number;
  maintenanceStatus: number;
  vulnerabilityIndex: number;
  ratedAt: Date;
  ratedBy: string;
}

interface AssetWithRating extends Asset {
  category: AssetCategory;
  zone: Zone;
  ratings: AssetRating[];
}

export function AssetRatingForm({
  assets,
  userId,
}: {
  assets: AssetWithRating[];
  userId: string;
}) {
  const [assetId, setAssetId] = useState("");
  const [physicalCondition, setPhysicalCondition] = useState("3");
  const [exposure, setExposure] = useState("3");
  const [criticality, setCriticality] = useState("3");
  const [adaptiveCapacityGap, setAdaptiveCapacityGap] = useState("3");
  const [maintenanceStatus, setMaintenanceStatus] = useState("3");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!assetId) {
      setMessage({ type: "error", text: "Please select an asset" });
      return;
    }

    setLoading(true);
    try {
      const res = await rateAssetAction(assetId, {
        physicalCondition: parseInt(physicalCondition),
        exposure: parseInt(exposure),
        criticality: parseInt(criticality),
        adaptiveCapacityGap: parseInt(adaptiveCapacityGap),
        maintenanceStatus: parseInt(maintenanceStatus),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Asset rated (VI: ${res.vi?.toFixed(2)})` });
        setAssetId("");
        setPhysicalCondition("3");
        setExposure("3");
        setCriticality("3");
        setAdaptiveCapacityGap("3");
        setMaintenanceStatus("3");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to rate asset" });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Rate Asset Vulnerability</h2>
      <p className="text-sm text-gray-600 mb-4">
        FR-AV-04: Five-criterion rating (1–5) where higher = more vulnerable.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Asset Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Asset to Rate *
          </label>
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            disabled={loading}
          >
            <option value="">-- Select asset --</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.zone.building} - {asset.zone.name})
              </option>
            ))}
          </select>
        </div>

        {/* Rating Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Physical Condition */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Physical Condition (1-5) *
              <span className="text-xs text-gray-500 ml-1">
                1=excellent → 5=severe damage
              </span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPhysicalCondition(String(val))}
                  className={`px-2 py-1 rounded text-sm ${
                    physicalCondition === String(val)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  disabled={loading}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Exposure */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Exposure (1-5) *
              <span className="text-xs text-gray-500 ml-1">
                1=protected → 5=fully exposed
              </span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setExposure(String(val))}
                  className={`px-2 py-1 rounded text-sm ${
                    exposure === String(val)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  disabled={loading}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Criticality */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Criticality (1-5) *
              <span className="text-xs text-gray-500 ml-1">
                1=optional → 5=essential
              </span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCriticality(String(val))}
                  className={`px-2 py-1 rounded text-sm ${
                    criticality === String(val)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  disabled={loading}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Adaptive Capacity Gap */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Adaptive Capacity Gap (1-5) *
              <span className="text-xs text-gray-500 ml-1">
                1=high capability → 5=no capacity
              </span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAdaptiveCapacityGap(String(val))}
                  className={`px-2 py-1 rounded text-sm ${
                    adaptiveCapacityGap === String(val)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  disabled={loading}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Maintenance Status */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Maintenance Status (1-5) *
              <span className="text-xs text-gray-500 ml-1">
                1=well-maintained → 5=urgent maintenance needed
              </span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMaintenanceStatus(String(val))}
                  className={`px-2 py-1 rounded text-sm ${
                    maintenanceStatus === String(val)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  disabled={loading}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
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
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {loading ? "Saving rating..." : "Save Rating"}
        </button>
      </form>
    </div>
  );
}
