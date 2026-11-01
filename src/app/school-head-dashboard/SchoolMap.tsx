"use client";

// FR-UX-03: School Head's first screen is the school map with zones shaded by risk band.
// Zones are colored by their mean risk score: HIGH (red), MEDIUM (yellow), LOW (green).

import { useState } from "react";

interface Zone {
  id: string;
  name: string;
  building: string;
  riskProfile: {
    meanScore: number;
    band: "HIGH" | "MEDIUM" | "LOW";
    hazardCount: number;
  };
}

interface SchoolMapProps {
  zones: Zone[];
  onZoneSelect: (zoneId: string) => void;
}

export function SchoolMap({ zones, onZoneSelect }: SchoolMapProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const getRiskColor = (band: "HIGH" | "MEDIUM" | "LOW"): string => {
    switch (band) {
      case "HIGH":
        return "#dc2626"; // red
      case "MEDIUM":
        return "#eab308"; // yellow
      case "LOW":
        return "#16a34a"; // green
    }
  };

  const getRiskLabel = (band: "HIGH" | "MEDIUM" | "LOW"): string => {
    switch (band) {
      case "HIGH":
        return "High Risk - Needs immediate attention";
      case "MEDIUM":
        return "Medium Risk - Needs attention this month";
      case "LOW":
        return "Low Risk - Monitor regularly";
    }
  };

  // Group zones by building
  const zonesByBuilding = new Map<string, Zone[]>();
  for (const zone of zones) {
    if (!zonesByBuilding.has(zone.building)) {
      zonesByBuilding.set(zone.building, []);
    }
    zonesByBuilding.get(zone.building)!.push(zone);
  }

  return (
    <div className="school-map-container">
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#dc2626" }}></div>
          <span>High Risk</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#eab308" }}></div>
          <span>Medium Risk</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#16a34a" }}></div>
          <span>Low Risk</span>
        </div>
      </div>

      <div className="map-grid">
        {Array.from(zonesByBuilding.entries()).map(([building, buildingZones]) => (
          <div key={building} className="building-section">
            <h3 className="building-name">{building}</h3>
            <div className="zones-grid">
              {buildingZones.map((zone) => (
                <button
                  key={zone.id}
                  className={`zone-tile ${zone.riskProfile.band.toLowerCase()} ${
                    selectedZoneId === zone.id ? "selected" : ""
                  }`}
                  style={{ borderColor: getRiskColor(zone.riskProfile.band) }}
                  onClick={() => {
                    setSelectedZoneId(zone.id);
                    onZoneSelect(zone.id);
                  }}
                >
                  <div className="zone-indicator" style={{ backgroundColor: getRiskColor(zone.riskProfile.band) }}></div>
                  <div className="zone-info">
                    <p className="zone-name">{zone.name}</p>
                    <p className="zone-score">{zone.riskProfile.meanScore.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedZone && (
        <div className="zone-details">
          <div className="details-header">
            <h2>{selectedZone.name}</h2>
            <p className="details-building">{selectedZone.building}</p>
            <button className="close-btn" onClick={() => setSelectedZoneId(null)}>
              ✕
            </button>
          </div>

          <div className="details-body">
            <div className="detail-row">
              <span className="detail-label">Risk Band</span>
              <span
                className={`detail-badge ${selectedZone.riskProfile.band.toLowerCase()}`}
                style={{ backgroundColor: getRiskColor(selectedZone.riskProfile.band) }}
              >
                {selectedZone.riskProfile.band}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Mean Risk Score</span>
              <span className="detail-value">{selectedZone.riskProfile.meanScore.toFixed(2)}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Verified Hazards</span>
              <span className="detail-value">{selectedZone.riskProfile.hazardCount}</span>
            </div>

            <p className="risk-meaning">{getRiskLabel(selectedZone.riskProfile.band)}</p>

            <button
              className="action-button"
              onClick={() => {
                // Navigate to hazard list for this zone
                window.location.href = `/verify?zone=${selectedZone.id}`;
              }}
            >
              View Hazards in This Zone →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
