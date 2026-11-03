/**
 * API client for the field officer offline sync endpoints.
 *
 * Paths are relative to the API base URL, which already ends in /api/v1
 * (see src/config/env.ts). The first version of this client prefixed every
 * path with /api/v1 again, so each call would have gone to
 * /api/v1/api/v1/... and returned 404.
 */
import { api } from "@/lib/api";
import type {
  OfflineSyncRecord,
  SyncOfflineRecordRequest,
  SyncOfflineRecordResponse,
} from "@/types/offline";

export const offlineApi = {
  /** Create the real record (application or violation) from a captured one. */
  syncRecord: (data: SyncOfflineRecordRequest) =>
    api.post<SyncOfflineRecordResponse>("/offline/sync", data),

  /** The signed in officer's sync history from the server ledger. */
  listMySyncs: (limit = 100) =>
    api.get<OfflineSyncRecord[]>("/offline/mine", {
      params: { limit },
    }),

  /** One ledger record, by ledger id or by the device clientRecordId. */
  getSyncStatus: (id: string) =>
    api.get<OfflineSyncRecord>(`/offline/status/${id}`),

  /** Hand a failed record back to the device queue for resending. */
  retrySync: (id: string) =>
    api.post<OfflineSyncRecord>(`/offline/${id}/retry`, {}),
};
