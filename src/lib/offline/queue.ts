/**
 * The on-device queue: capture, edit, inspect and delete captured records.
 *
 * Rules that live here, in one place, so every capture path behaves the
 * same (service application forms, violations, and any future form):
 *
 * 1. A record belongs to one officer. Queues are scoped by officerId, so a
 *    second officer signing in on the same phone never sees or syncs the
 *    first officer's work.
 * 2. An application record is not ready until its required evidence files
 *    are attached. Photos and documents verify what the form claims, so a
 *    record missing them stays a draft and will not sync.
 * 3. A record can be edited freely until it syncs. Every change appends to
 *    its editHistory automatically: field, old value, new value, time.
 *    After a successful sync the record is locked.
 * 4. Photos are compressed on the device before storage. Field photos are
 *    large and the network they sync over is not.
 */
import {
  offlineDb,
  notifyOfflineQueueChanged,
  type OfflineFileRow,
  type OfflineQueueRecord,
} from "./db";
import type {
  OfflineApplicant,
  OfflineRecordType,
} from "@/types/offline";

export interface CaptureFileInput {
  documentType: string;
  file: File | Blob;
  name?: string;
}

export interface CaptureInput {
  recordType: OfflineRecordType;
  officerId: string;
  title: string;
  serviceId?: string;
  serviceCode?: string;
  formData: Record<string, unknown>;
  applicant?: OfflineApplicant;
  files?: CaptureFileInput[];
  requiredDocumentTypes?: string[];
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Shrink a large photo to at most 1600px on its longest side, as JPEG. */
export async function compressImageIfNeeded(file: Blob): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/png") {
    return file;
  }
  if (file.size < 700 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= 1600) return file;
    const scale = 1600 / longest;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Extract real files from a service form payload, in the shapes the
 *  existing forms produce: a File, a Blob, or an object holding one. */
export function extractFilesFromPayload(
  files: Record<string, unknown> | undefined,
): CaptureFileInput[] {
  if (!files) return [];
  const out: CaptureFileInput[] = [];
  for (const [key, value] of Object.entries(files)) {
    if (!value) continue;
    if (value instanceof File) {
      out.push({ documentType: key, file: value, name: value.name });
    } else if (value instanceof Blob) {
      out.push({ documentType: key, file: value, name: `${key}.pdf` });
    } else if (typeof value === "object") {
      const inner = (value as { file?: unknown }).file;
      if (inner instanceof File) {
        out.push({ documentType: key, file: inner, name: inner.name });
      } else if (inner instanceof Blob) {
        out.push({ documentType: key, file: inner, name: `${key}.pdf` });
      }
    }
  }
  return out;
}

async function computeStatus(
  record: OfflineQueueRecord,
): Promise<OfflineQueueRecord["status"]> {
  if (record.status === "synced" || record.status === "syncing") {
    return record.status;
  }
  if (record.requiredDocumentTypes.length === 0) return "ready";
  const rows = await offlineDb.files
    .where("clientRecordId")
    .equals(record.clientRecordId)
    .toArray();
  const present = new Set(rows.map((r) => r.documentType));
  const missing = record.requiredDocumentTypes.some((t) => !present.has(t));
  if (missing) return "draft";
  // An application with declared requirements but no files at all is also
  // incomplete, even when the required keys were not enumerated.
  if (record.recordType === "application" && rows.length === 0) {
    return "draft";
  }
  return "ready";
}

/** Capture a completed form into the queue. Returns the stored record. */
export async function captureRecord(
  input: CaptureInput,
): Promise<OfflineQueueRecord> {
  const now = new Date().toISOString();
  const record: OfflineQueueRecord = {
    clientRecordId: newId(),
    recordType: input.recordType,
    officerId: input.officerId,
    title: input.title,
    serviceId: input.serviceId,
    serviceCode: input.serviceCode,
    formData: input.formData,
    applicant: input.applicant,
    requiredDocumentTypes: input.requiredDocumentTypes ?? [],
    editHistory: [],
    status: "ready",
    failureReason: null,
    capturedAt: now,
    updatedAt: now,
    serverApplicationId: null,
    serverViolationId: null,
    syncedAt: null,
  };

  await offlineDb.records.add(record);

  for (const entry of input.files ?? []) {
    const blob = await compressImageIfNeeded(entry.file);
    const row: OfflineFileRow = {
      id: newId(),
      clientRecordId: record.clientRecordId,
      documentType: entry.documentType,
      name: entry.name || `file-${Date.now()}`,
      type: blob.type || entry.file.type || "application/octet-stream",
      size: blob.size,
      blob,
    };
    await offlineDb.files.add(row);
  }

  record.status = await computeStatus(record);
  await offlineDb.records.put(record);
  notifyOfflineQueueChanged();
  return record;
}

/** Attach one more evidence file to a draft that is missing some. */
export async function addFileToRecord(
  clientRecordId: string,
  documentType: string,
  file: File,
): Promise<void> {
  const record = await offlineDb.records.get(clientRecordId);
  if (!record || record.status === "synced" || record.status === "syncing") {
    return;
  }
  const blob = await compressImageIfNeeded(file);
  await offlineDb.files.add({
    id: newId(),
    clientRecordId,
    documentType,
    name: file.name,
    type: blob.type || file.type,
    size: blob.size,
    blob,
  });
  record.status = await computeStatus(record);
  record.updatedAt = new Date().toISOString();
  await offlineDb.records.put(record);
  notifyOfflineQueueChanged();
}

/**
 * Edit fields of a captured record. Every changed field is written into
 * the record's editHistory automatically. Synced records are locked.
 */
export async function editRecord(
  clientRecordId: string,
  changes: Record<string, unknown>,
): Promise<OfflineQueueRecord | null> {
  const record = await offlineDb.records.get(clientRecordId);
  if (!record || record.status === "synced" || record.status === "syncing") {
    return null;
  }
  const now = new Date().toISOString();
  for (const [field, newValue] of Object.entries(changes)) {
    const oldValue = record.formData[field];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      record.editHistory.push({ field, oldValue, newValue, editedAt: now });
      record.formData[field] = newValue;
    }
  }
  record.updatedAt = now;
  if (record.status === "failed") record.status = "ready";
  record.status = await computeStatus(record);
  await offlineDb.records.put(record);
  notifyOfflineQueueChanged();
  return record;
}

/** Delete a record that has not synced. Synced history is kept. */
export async function deleteRecord(clientRecordId: string): Promise<void> {
  const record = await offlineDb.records.get(clientRecordId);
  if (!record || record.status === "synced") return;
  await offlineDb.files.where("clientRecordId").equals(clientRecordId).delete();
  await offlineDb.records.delete(clientRecordId);
  notifyOfflineQueueChanged();
}

export async function listRecords(
  officerId: string,
): Promise<OfflineQueueRecord[]> {
  const rows = await offlineDb.records
    .where("officerId")
    .equals(officerId)
    .toArray();
  return rows.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export async function countWaiting(officerId: string): Promise<number> {
  const rows = await offlineDb.records
    .where("officerId")
    .equals(officerId)
    .toArray();
  return rows.filter(
    (r) => r.status === "ready" || r.status === "failed" || r.status === "draft",
  ).length;
}

export async function getRecordFiles(
  clientRecordId: string,
): Promise<OfflineFileRow[]> {
  return offlineDb.files
    .where("clientRecordId")
    .equals(clientRecordId)
    .toArray();
}
