/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../lib/api";
import { Role } from "./apiOverview";

// Types based on your controller
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "citizen" | "business_owner";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  suspendedAt: string | null;
  suspendedById: string | null;
  suspensionReason: string | null;
  passwordResetRequired: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  avatarUrl: string | null;
  address: string | null;
  tokenVersion: number;
  
  // Profile Information
  dateOfBirth: string | null;
  gender: string | null;
  town: string | null;
  occupation: string | null;
  nin: string | null;
  cacNumber: string | null;
  businessName: string | null;
  businessType: string | null;
  taxIdNumber: string | null;
  
  // New fields for onboarding
  emergencyContact: string | null;
  identificationType: string | null;
  identificationNumber: string | null;
  ownerRepresentative: string | null;
  passportPhoto: string | null;
  
  // Onboarding status
  onboardingCompleted: boolean;
  emailVerifiedAt: string | null;
  
  // Relationships
  createdById: string | null;
  wardId: string | null;
  assignedWardId: string | null;
  contractorId: string | null;
  commissionRate: number;
  agentId: string | null;
  isWalkIn: boolean;
  walkInRegisteredById: string | null;
  
  // Notification preferences
  notifyByEmail: boolean;
  notifyBySms: boolean;
  notifyByInApp: boolean;
  
  // Nested relations
  ward: Ward | null;
  createdBy: User | null;
  suspendedBy: User | null;
  
  // Metadata
  meta: any | null;
  error: any | null;
}


// Ward Interface
export interface Ward {
  id: string;
  name: string;
}


export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    // role: string;
    user?: any;
}

export interface GoogleLoginData {
  token: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  error: string | null;
}
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}


export const authService = {
  // Register new user
  register: (data: RegisterData) =>
    api.post<{ user: User; emailVerificationRequired: boolean }>("/auth/register", data),

  // Login with email/password
  login: (credentials: LoginCredentials) => api.post<AuthResponse>("/auth/login", credentials),
  verifyEmail: (token: string) => api.get<{message:string}>(`/auth/verify-email?token=${token}`),

  resendEmail: (email: string) => api.post<any>("/auth/resend-verification", {email}),

  // Get current user profile
  getMe: () => api.get<User>("/auth/me"),

  updateUserProfile: (data: Partial<User>) => api.patch<User>(`/auth/update/profile/${tokenManager.getUser()?.id}`, data),

  // Google login
  googleLogin: (data: GoogleLoginData) => api.post<AuthResponse>("/auth/google", data),

   // Forgot Password
  forgotPassword: (data: ForgotPasswordData) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  // Reset Password
  resetPassword: (data: ResetPasswordData) =>
    api.post<{ message: string }>('/auth/reset-password', data),

  // Change Password (authenticated)
  changePassword: (data: ChangePasswordData) =>
    api.patch<{ message: string ,accessToken:string}>('/auth/change-password', data),

  // Refresh access token
  refreshToken: (refreshToken: string) =>
    api.post<RefreshTokenResponse>("/auth/refresh", { refreshToken }),

  // Logout (optional - your backend might have a logout endpoint)
  logout: () =>
    api.post<void>("/auth/logout").catch(() => {
      // Even if the endpoint fails, we should clear local data
      return Promise.resolve();
    }),
};

// Helper functions for token management
export const tokenManager = {
  getAccessToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("logmas.auth.token");
  },

  setAccessToken: (token: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem("logmas.auth.token", token);
    } else {
      localStorage.removeItem("logmas.auth.token");
    }
  },

  getRefreshToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("logmas.auth.refreshToken");
  },

  setRefreshToken: (token: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem("logmas.auth.refreshToken", token);
    } else {
      localStorage.removeItem("logmas.auth.refreshToken");
    }
  },

  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("logmas.auth.user");
    return raw ? JSON.parse(raw) : null;
  },

  setUser: (user: User | null) => {
    if (typeof window === "undefined") return;
    if (user) localStorage.setItem("logmas.auth.user", JSON.stringify(user));
    else localStorage.removeItem("logmas.auth.user");
  },

  clearAllTokens: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("logmas.auth.token");
    localStorage.removeItem("logmas.auth.refreshToken");
    localStorage.removeItem("logmas.auth.user"); // ← add this line
  },
};
