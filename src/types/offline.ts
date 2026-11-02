/**
 * Offline Sync Types for GFA Logmas Backend Integration
 *
 * These types correspond to the OfflineSync Prisma model and the
 * three API endpoints: POST /sync, GET /status/:id, POST /:id/retry
 */

import { Application } from "./types/application";

export interface OfflineSyncRecord {
  id: string;
  applicationId: string;
  application?: Application;
  formType: string;
  formData: Record<string, any>;
  source: "web" | "mobile" | "field_officer" | "manual";
  status: "pending" | "synced" | "failed";
  submittedAt: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncOfflineFormRequest {
  formType: string;
  formData: Record<string, any>;
  source: "web" | "mobile" | "field_officer" | "manual";
}

export interface OfflineSyncStatusResponse {
  id: string;
  applicationId: string;
  application?: Application;
  formType: string;
  formData: Record<string, any>;
  source: string;
  status: "pending" | "synced" | "failed";
  submittedAt: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}