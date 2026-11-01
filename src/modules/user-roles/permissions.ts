// SRS Section 2: user role permissions. FR-UR-02: each function restricted to specific roles.
import type { Role } from "@/generated/prisma/enums";

// FR-UR-02, role table row "Submit a hazard report": every role except System Administrator.
// FR-UR-06 also bars the System Administrator from the content of hazard reports.
const ROLES_THAT_SUBMIT_HAZARDS: ReadonlySet<Role> = new Set<Role>([
  "SCHOOL_HEAD",
  "DRRM_COORDINATOR",
  "SCHOOL_PERSONNEL",
  "COMMUNITY_USER",
]);

// FR-UR-02, role table row "Record assets and vulnerability ratings": DRRM Coordinator (FR-AV-01).
const ROLES_THAT_MANAGE_ASSETS: ReadonlySet<Role> = new Set<Role>(["DRRM_COORDINATOR"]);

// FR-UR-10: an account may hold several roles; any permitted role is enough.
export function canSubmitHazardReport(roles: readonly Role[]): boolean {
  return roles.some((role) => ROLES_THAT_SUBMIT_HAZARDS.has(role));
}

// FR-AV-01: DRRM Coordinator adds, edits, and retires assets.
export function canManageAssets(roles: readonly Role[]): boolean {
  return roles.some((role) => ROLES_THAT_MANAGE_ASSETS.has(role));
}

// FR-UR-02, role table row "Verify or reject reports": School Head and DRRM Coordinator.
// Used by FR-RS-01: verifiers compute risk scores for verified hazards.
const ROLES_THAT_VERIFY_HAZARDS: ReadonlySet<Role> = new Set<Role>(["SCHOOL_HEAD", "DRRM_COORDINATOR"]);

// FR-RS-01: verifier computes risk scores.
export function canVerifyHazards(roles: readonly Role[]): boolean {
  return roles.some((role) => ROLES_THAT_VERIFY_HAZARDS.has(role));
}
