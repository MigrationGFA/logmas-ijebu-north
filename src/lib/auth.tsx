/**
 * Shared role vocabulary for the app: the Role type and its labels.
 *
 * This module used to contain a complete mock authentication system:
 * an AuthProvider that signed people in against a hardcoded
 * TEST_CREDENTIALS table (demo1234 for every role), invented persona
 * names per role, and persisted a "mock-token" as if it were a session.
 * That provider was never mounted (real auth lives in
 * src/hooks/queries/useAuth.ts against the backend), but the credential
 * table was still imported by the login page to offer one-click demo
 * sign-ins, which meant a list of working-role passwords shipped in the
 * production bundle. All of it is deleted. What remains is only what
 * other modules actually import: the Role type, AuthUser shape, role
 * labels and the manageable-roles list.
 */

export type Role =
  | "super_admin"
  | "chairman"
  | "lga_admin"
  | "ward_councillor"
  | "treasurer"
  // | "agent"
  | "auditor"
  | "contractor"
  | "field_officer"
  | "citizen"
  | "business_owner";

export interface AuthUser {
  id: string;
  firstName: string;
  email: string;
  role: Role;
  avatar?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  chairman: "Chairman",
  lga_admin: "LGA Admin",
  ward_councillor: "Ward Councillor",
  treasurer: "Treasurer",
  auditor: "Auditor",
  contractor: "Contractor / Agent",
  field_officer: "Field Officer",
  //  agent: "Agent",
  citizen: "Citizen",
  business_owner: "Business Owner",
};

export const MANAGEABLE_ROLES: Role[] = [
  "chairman",
  // "ward_councillor",
  "auditor",
  "treasurer",
  // "contractor",
  "field_officer",
  "business_owner",
  "citizen",
];
