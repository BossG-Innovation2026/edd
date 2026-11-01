// FR-HL-02: predefined hazard categories and types, copied from the table in SRS Section 3.1
// ("draft hazard indicators for SOP 5a"). The seed loads this list into the database, where it
// can later be changed through settings after School Head approval (FR-UR-07, NFR-FL-01).

export type CatalogCategory = {
  code: string;
  name: string;
  types: string[];
};

export const OTHER_TYPE_NAME = "Other";

export const HAZARD_CATALOG: CatalogCategory[] = [
  {
    code: "NATURAL",
    name: "Natural",
    types: ["Earthquake", "Flood", "Typhoon and strong winds", "Landslide", OTHER_TYPE_NAME],
  },
  {
    code: "FACILITY_STRUCTURAL",
    name: "Facility and structural",
    types: [
      "Fire hazard",
      "Electrical hazard",
      "Structural damage",
      "Blocked exits",
      "Unsafe furniture or equipment",
      OTHER_TYPE_NAME,
    ],
  },
  {
    code: "HEALTH_SANITATION",
    name: "Health and sanitation",
    types: [
      "Unsafe drinking water",
      "Sanitation facility problems",
      "Disease outbreak",
      "Food safety",
      OTHER_TYPE_NAME,
    ],
  },
  {
    code: "SECURITY_PERSONAL_SAFETY",
    name: "Security and personal safety",
    types: [
      "Unauthorized entry or intruder",
      "Bullying",
      "Violence or fighting",
      "Harassment",
      OTHER_TYPE_NAME,
    ],
  },
];
