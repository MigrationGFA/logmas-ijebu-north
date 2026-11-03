/**
 * Offline sync types for field officer capture.
 *
 * One source of truth, shared by the on-device queue (src/lib/offline),
 * the API client (src/services/apiOffline) and the queue UI. The server
 * contract lives in the backend offline module: POST /offline/sync,
 * GET /offline/mine, GET /offline/status/:id, POST /offline/:id/retry.
 *
 * The first version of this file imported Application from a path that did
 * not exist and was duplicated inside apiOffline.ts with a different shape.
 * Both are gone: this is the only copy.
 */
import type { Application } from "./application";

export type OfflineRecordType = "application" | "violation";

/** Lifecycle of a record inside the on-device queue. */
export type OfflineQueueStatus =
  | "draft" // captured, but required evidence (photos) is still missing
  | "ready" // complete, waiting for network
  | "syncing" // a sync attempt is running right now
  | "failed" // last sync attempt failed; failureReason says why
  | "synced"; // on the server; kept on the device as history only

/** Lifecycle of a record on the server ledger. */
export type OfflineSyncStatus =
  | "pending"
  | "processing"
  | "synced"
  | "failed";

export interface OfflineEditEntry {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  editedAt: string;
}

export interface OfflineApplicant {
  applicantId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface OfflineFileManifestEntry {
  documentType?: string;
  originalName: string;
  fileName: string;
  url: string;
  mimeType?: string;
  fileSize?: number;
}

/** Payload the device posts to POST /offline/sync. */
export interface SyncOfflineRecordRequest {
  clientRecordId: string;
  recordType: OfflineRecordType;
  serviceId?: string;
  serviceCode?: string;
  formData: Record<string, unknown>;
  applicant?: OfflineApplicant;
  files: OfflineFileManifestEntry[];
  editHistory: OfflineEditEntry[];
  capturedAt: string;
  source: "field_officer";
}

/** The server ledger row, as returned by the offline endpoints. */
export interface OfflineSyncRecord {
  id: string;
  clientRecordId: string;
  recordType: OfflineRecordType;
  officerId: string;
  applicationId?: string | null;
  application?: Application | null;
  violationId?: string | null;
  formType: string;
  formData: Record<string, unknown>;
  status: OfflineSyncStatus;
  failureReason?: string | null;
  capturedAt: string;
  submittedAt: string;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncOfflineRecordResponse {
  sync: OfflineSyncRecord;
  result: {
    application?: {
      id: string;
      applicationNumber: string;
      status: string;
    } | null;
    invoice?: { id: string; invoiceNumber: string } | null;
    violation?: { id: string; status: string } | null;
    applicationId?: string | null;
    violationId?: string | null;
    newCitizenCreated?: boolean;
    duplicate?: boolean;
  };
}
