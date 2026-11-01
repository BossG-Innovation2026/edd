"use client";

import { useState } from "react";
import { createAssetAction } from "@/modules/asset-vulnerability/actions";
import type { Db } from "@/lib/db";

interface Zone {
  id: string;
  name: string;
  building: string;
}

interface AssetCategory {
  id: string;
  name: string;
}

export function AssetForm({
  zones,
  categories,
}: {
  zones: Zone[];
  categories: AssetCategory[];
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name || !categoryId || !zoneId) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    setLoading(true);
    try {
      const res = await createAssetAction({
        name,
        categoryId,
        zoneId,
        quantity: parseInt(quantity),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Asset created successfully" });
        setName("");
        setCategoryId("");
        setZoneId("");
        setQuantity("1");
        // In a real app, refresh the asset list
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ type: "error", text: res.error || "Failed to create asset" });
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
      <h2 className="text-2xl font-semibold mb-4">Add New Asset</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Asset Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Asset Name *
            <span className="text-xs text-gray-500 ml-1">(e.g., "Classroom 1 Door", "Classroom Block B")</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Enter asset name"
            disabled={loading}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Category *
            <span className="text-xs text-gray-500 ml-1">(FR-AV-03)</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            disabled={loading}
          >
            <option value="">-- Select category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Zone */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Zone *
            <span className="text-xs text-gray-500 ml-1">(Location in school)</span>
          </label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            disabled={loading}
          >
            <option value="">-- Select zone --</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.building} - {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Quantity
            <span className="text-xs text-gray-500 ml-1">(default: 1)</span>
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="w-full px-3 py-2 border rounded text-sm"
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
          {loading ? "Creating..." : "Add Asset"}
        </button>
      </form>
    </div>
  );
}
