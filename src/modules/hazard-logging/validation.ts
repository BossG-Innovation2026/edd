// Input rules for a hazard report (FR-HL-01, FR-HL-02, FR-HL-04).
// Pure functions, shared by the form (per step) and the server (whole report).
import { z } from "zod";

export const SEVERITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HIGH", label: "High" },
] as const;

// Allowance for a phone clock that runs a little fast.
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const requiredText = (message: string, max: number) =>
  z.string({ error: message }).trim().min(1, { error: message }).max(max, { error: `Keep this under ${max} characters.` });

// The fields the reporter fills in. Reporter, status, and Report ID are set by the server.
export const hazardReportInputSchema = z.object({
  // FR-HL-04: zone chosen from the school map.
  zoneId: requiredText("Choose the zone where you saw the hazard.", 100),
  // FR-HL-04: exact location described in text.
  locationDescription: requiredText("Describe the exact spot, for example \"beside the back door of Room 102\".", 500),
  // FR-HL-02: category and type from the predefined list (checked against the database).
  categoryId: requiredText("Choose a hazard category.", 100),
  typeId: requiredText("Choose a hazard type.", 100),
  // FR-HL-02: required only when the type is "Other" (enforced in checkHazardClassification).
  otherTypeSpecified: z.string().trim().max(120, { error: "Keep this under 120 characters." }).optional(),
  description: requiredText("Describe what you saw.", 2000),
  observedAt: z.coerce
    .date({ error: "Enter the date and time you saw the hazard." })
    .refine((d) => d.getTime() <= Date.now() + CLOCK_SKEW_MS, { error: "The date and time cannot be in the future." }),
  initialSeverity: z.enum(["LOW", "MODERATE", "HIGH"], { error: "Choose how serious it looks: Low, Moderate, or High." }),
  // FR-UX-06: anonymous option for security/personal safety reports.
  isAnonymous: z.boolean().optional().default(false),
});

export type HazardReportInput = z.infer<typeof hazardReportInputSchema>;

export type FieldErrors = Partial<Record<keyof HazardReportInput, string>>;

export type CatalogType = { id: string; categoryId: string; isOther: boolean };

// FR-HL-02: the type must be on the predefined list, belong to the chosen category,
// and an "Other" type must say what the hazard is.
export function checkHazardClassification(
  input: Pick<HazardReportInput, "categoryId" | "typeId" | "otherTypeSpecified">,
  type: CatalogType | null | undefined,
): FieldErrors {
  if (!type) return { typeId: "Choose a hazard type from the list." };
  if (type.categoryId !== input.categoryId) return { typeId: "That type does not belong to the chosen category." };
  if (type.isOther && !input.otherTypeSpecified?.trim()) {
    return { otherTypeSpecified: "You chose \"Other\". Say what kind of hazard it is." };
  }
  return {};
}

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof HazardReportInput | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
