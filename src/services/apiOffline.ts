/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@/lib/api";

export interface OfflineSyncRecord {
  id: string;
  applicationId: string;
  application?: {
    id: string;
    applicationNumber: string;
    serviceName?: string;
    status: string;
  };
  formType: string;
  formData: any;
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
  application?: {
    id: string;
    applicationNumber: string;
    serviceName?: string;
    status: string;
  };
  formType: string;
  formData: Record<string, any>;
  source: string;
  status: "pending" | "synced" | "failed";
  submittedAt: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Queue a form for offline sync */
export function syncOfflineForm(data: SyncOfflineFormRequest): Promise<OfflineSyncRecord> {
  return api.post<OfflineSyncRecord>("/api/v1/offline/sync", data);
}

/** Retrieve offline sync status by ID (includes application info) */
export function getOfflineSyncStatus(
  id: string
): Promise<OfflineSyncStatusResponse> {
  return api.get<OfflineSyncStatusResponse>(`/api/v1/offline/status/${id}`);
}

/** Reset status and retry a failed sync */
export function retrySync(id: string): Promise<OfflineSyncRecord> {
  return api.post<OfflineSyncRecord>(`/api/v1/offline/${id}/retry`, {});
}