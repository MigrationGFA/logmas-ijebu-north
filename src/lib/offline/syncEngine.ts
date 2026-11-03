/**
 * The sync engine: drains the on-device queue to the server.
 *
 * Order of work for each record:
 * 1. Upload every stored file through the existing /uploads route, one by
 *    one. A file that already has an uploadedUrl is never uploaded again,
 *    so a retry after a failure only sends what is still missing.
 * 2. Post the record to POST /offline/sync with the file manifest. The
 *    server creates the real application or violation in that request and
 *    answers with its ids. The record's clientRecordId is the idempotency
 *    key, so posting the same record twice cannot duplicate it.
 * 3. Mark the record synced on the device, record the server ids, and drop
 *    the stored file Blobs. The evidence now lives on the server.
 *
 * Sync is triggered three ways, because no single trigger is reliable on
 * its own: the browser online event, the app opening, and the officer
 * pressing Sync Now. There is no payment step anywhere in this flow.
 */
import { offlineDb, notifyOfflineQueueChanged, type OfflineQueueRecord } from "./db";
import { getRecordFiles } from "./queue";
import { offlineApi } from "@/services/apiOffline";
import { uploadsService } from "@/services/uploads";
import type { OfflineFileManifestEntry } from "@/types/offline";

let syncing = false;

export function isSyncing() {
  return syncing;
}

async function uploadPendingFiles(
  record: OfflineQueueRecord,
): Promise<OfflineFileManifestEntry[]> {
  const rows = await getRecordFiles(record.clientRecordId);
  const manifest: OfflineFileManifestEntry[] = [];

  for (const row of rows) {
    if (!row.uploadedUrl) {
      const file = new File([row.blob], row.name, { type: row.type });
      const result = await uploadsService.uploadFile(file, "general");
      const anyResult = result as unknown as {
        url: string;
        filename?: string;
        fileName?: string;
        size?: number;
      };
      row.uploadedUrl = anyResult.url;
      row.uploadedFileName =
        anyResult.filename || anyResult.fileName || row.name;
      await offlineDb.files.put(row);
    }
    manifest.push({
      documentType: row.documentType,
      originalName: row.name,
      fileName: row.uploadedFileName || row.name,
      url: row.uploadedUrl,
      mimeType: row.type,
      fileSize: row.size,
    });
  }
  return manifest;
}

async function syncOne(record: OfflineQueueRecord): Promise<void> {
  await offlineDb.records.update(record.clientRecordId, {
    status: "syncing",
    failureReason: null,
  });
  notifyOfflineQueueChanged();

  try {
    const files = await uploadPendingFiles(record);
    const response = await offlineApi.syncRecord({
      clientRecordId: record.clientRecordId,
      recordType: record.recordType,
      serviceId: record.serviceId,
      serviceCode: record.serviceCode,
      formData: record.formData,
      applicant: record.applicant,
      files,
      editHistory: record.editHistory,
      capturedAt: record.capturedAt,
      source: "field_officer",
    });

    await offlineDb.records.update(record.clientRecordId, {
      status: "synced",
      syncedAt: new Date().toISOString(),
      serverApplicationId:
        response.result.application?.id ??
        response.result.applicationId ??
        null,
      serverApplicationNumber:
        response.result.application?.applicationNumber ?? null,
      serverViolationId:
        response.result.violation?.id ?? response.result.violationId ?? null,
      failureReason: null,
    });
    // Evidence is on the server now; free the device storage.
    await offlineDb.files
      .where("clientRecordId")
      .equals(record.clientRecordId)
      .delete();
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Sync failed. Please retry.";
    await offlineDb.records.update(record.clientRecordId, {
      status: "failed",
      failureReason: reason,
    });
  }
  notifyOfflineQueueChanged();
}

/**
 * Sync every ready or failed record belonging to the given officer.
 * Drafts (missing required evidence) are skipped on purpose.
 * Returns how many records synced successfully.
 */
export async function syncAllForOfficer(officerId: string): Promise<number> {
  if (syncing) return 0;
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
  syncing = true;
  let synced = 0;
  try {
    const rows = await offlineDb.records
      .where("officerId")
      .equals(officerId)
      .toArray();
    const waiting = rows
      .filter((r) => r.status === "ready" || r.status === "failed")
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    for (const record of waiting) {
      const before = await offlineDb.records.get(record.clientRecordId);
      await syncOne(record);
      const after = await offlineDb.records.get(record.clientRecordId);
      if (before && after?.status === "synced") synced += 1;
    }
  } finally {
    syncing = false;
    notifyOfflineQueueChanged();
  }
  return synced;
}
