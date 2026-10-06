"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setAuthToken } from "@/lib/api";
import { AUTH_STORAGE_KEY, readStoredUser } from "@/lib/auth-storage";

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

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    phone?: string;
  }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

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

const ROLE_NAMES: Record<Role, string> = {
  super_admin: "Adewale Super",
  chairman: "Hon. Dr. Waliat Folasade Adeyemo",
  lga_admin: "Olumide Admin",
  treasurer: "Yetunde Treasurer",
  auditor: "Folake Auditor",
  //  agent: "Sade Subagent",
  ward_councillor: "Honourable Bisi",
  contractor: "Femi Agent",
  field_officer: "Tunji Field",
  citizen: "Adebayo Citizen",
  business_owner: "Bola Enterprises",
};

export const TEST_CREDENTIALS: { role: Role; email: string; password: string }[] = [
  { role: "super_admin", email: "super@logmas.gov.ng", password: "demo1234" },
  { role: "chairman", email: "chairman@logmas.gov.ng", password: "demo1234" },
  { role: "lga_admin", email: "gakeg83497@dd2car.com", password: "gakeg83497@dd2car.com" },
  { role: "treasurer", email: "treasurer@logmas.gov.ng", password: "demo1234" },
  { role: "auditor", email: "auditor@logmas.gov.ng", password: "demo1234" },
  { role: "ward_councillor", email: "councillor@logmas.gov.ng", password: "demo1234" },
  { role: "field_officer", email: "field@logmas.gov.ng", password: "demo1234" },
  // { role: "agent", email: "subagent@logmas.gov.ng", password: "demo1234" },
  { role: "contractor", email: "agent@logmas.gov.ng", password: "demo1234" },
  { role: "citizen", email: "evans@joemarineng.com", password: "demo1234" },
  // { role: "citizen", email: "citizen@logmas.gov.ng", password: "demo1234" },
  { role: "business_owner", email: "business@logmas.gov.ng", password: 'demo1234' },
];

function readStored(): AuthUser | null {
  return readStoredUser() as AuthUser | null;
}

function persist(u: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (u) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
    setAuthToken(`mock-token-${u.role}-${u.id}`);
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthToken(null);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (stored) setAuthToken(`mock-token-${stored.role}-${stored.id}`);
    const timer = setTimeout(() => {
      setUser(stored);
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    const match = TEST_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!match || password !== match.password) {
      return { error: "Invalid email or password. Use a demo account below." };
    }
    const u: AuthUser = {
      id: `mock-${match.role}`,
      email: match.email,
      firstName: ROLE_NAMES[match.role],
      role: match.role,
    };
    persist(u);
    setUser(u);
    return {};
  };

  const loginWithGoogle: AuthCtx["loginWithGoogle"] = async () => {
    const u: AuthUser = {
      id: "mock-google-citizen",
      email: "google.user@logmas.gov.ng",
      firstName: "Google Demo User",
      role: "citizen",
    };
    persist(u);
    setUser(u);
    return {};
  };

  const register: AuthCtx["register"] = async ({ name, email, role }) => {
    const u: AuthUser = {
      id: `mock-${Date.now()}`,
      email,
      firstName: name || email.split("@")[0],
      role,
    };
    persist(u);
    setUser(u);
    return {};
  };

  const logout = async () => {
    persist(null);
    setUser(null);
  };

  const refreshRole = async () => {};

  return (
    <Ctx.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshRole,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
