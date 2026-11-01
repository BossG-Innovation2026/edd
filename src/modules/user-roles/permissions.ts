// SRS Section 2 (minimal subset). Only the permission Module 3.1 needs is defined here.
import type { Role } from "@/generated/prisma/enums";

// FR-UR-02, role table row "Submit a hazard report": every role except System Administrator.
// FR-UR-06 also bars the System Administrator from the content of hazard reports.
const ROLES_THAT_SUBMIT_HAZARDS: ReadonlySet<Role> = new Set<Role>([
  "SCHOOL_HEAD",
  "DRRM_COORDINATOR",
  "SCHOOL_PERSONNEL",
  "COMMUNITY_USER",
]);

// FR-UR-10: an account may hold several roles; any permitted role is enough.
export function canSubmitHazardReport(roles: readonly Role[]): boolean {
  return roles.some((role) => ROLES_THAT_SUBMIT_HAZARDS.has(role));
}
