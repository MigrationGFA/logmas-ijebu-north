/**
 * On-device storage for field officer offline capture, backed by
 * IndexedDB through Dexie.
 *
 * Why IndexedDB and not localStorage: a queue record carries photo and
 * document files as Blobs. localStorage holds only small strings (about
 * 5 MB, shared with the auth tokens and the legacy stores) and cannot hold
 * a File at all. IndexedDB is built for this and is what every serious
 * offline web app uses.
 *
 * Three stores:
 * - records: one row per captured record (the queue itself).
 * - files:   the actual file Blobs belonging to a record, kept out of the
 *            record row so listing the queue stays light.
 * - pack:    the offline reference pack (services, wards, officer profile)
 *            saved while online so forms can open in the field.
 */
import Dexie, { type Table } from "dexie";
import type {
  OfflineApplicant,
  OfflineEditEntry,
  OfflineQueueStatus,
  OfflineRecordType,
} from "@/types/offline";

export interface OfflineQueueRecord {
  clientRecordId: string;
  recordType: OfflineRecordType;
  officerId: string;
  /** Human label for the queue screen, e.g. the service name. */
  title: string;
  serviceId?: string;
  serviceCode?: string;
  formData: Record<string, unknown>;
  applicant?: OfflineApplicant;
  /** Document types this record must carry evidence for before it is ready. */
  requiredDocumentTypes: string[];
  editHistory: OfflineEditEntry[];
  status: OfflineQueueStatus;
  failureReason?: string | null;
  capturedAt: string;
  updatedAt: string;
  /** Set once the server confirms the sync. */
  serverApplicationId?: string | null;
  serverApplicationNumber?: string | null;
  serverViolationId?: string | null;
  syncedAt?: string | null;
}

export interface OfflineFileRow {
  id: string;
  clientRecordId: string;
  documentType: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  /** Filled by the sync engine once this file has reached the server. */
  uploadedUrl?: string;
  uploadedFileName?: string;
}

export interface OfflinePackRow {
  key: string;
  data: unknown;
  savedAt: string;
}

class LogmasOfflineDb extends Dexie {
  records!: Table<OfflineQueueRecord, string>;
  files!: Table<OfflineFileRow, string>;
  pack!: Table<OfflinePackRow, string>;

  constructor() {
    super("logmas-offline");
    this.version(1).stores({
      records: "clientRecordId, officerId, status, capturedAt",
      files: "id, clientRecordId",
      pack: "key",
    });
  }
}

export const offlineDb = new LogmasOfflineDb();

export const OFFLINE_QUEUE_EVENT = "logmas:offline-queue-change";

/** Tell the status bar and the queue screen that the queue changed. */
export function notifyOfflineQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OFFLINE_QUEUE_EVENT));
  }
}
