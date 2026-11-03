/**
 * The offline reference pack.
 *
 * While the officer is online, the dashboard saves the data the field
 * forms need (the services list with their fees, the wards, the officer's
 * own profile) into IndexedDB, with the time it was saved. When the app
 * opens with no network, forms read the pack instead of the API, so a
 * capture can still name the right service and ward.
 *
 * The pack is reference data only. It never holds another officer's queue
 * and it is safe to overwrite on every online dashboard visit.
 */
import { offlineDb } from "./db";

export const PACK_KEYS = {
  services: "services",
  wards: "wards",
  profile: "profile",
} as const;

export async function savePackEntry(key: string, data: unknown): Promise<void> {
  await offlineDb.pack.put({ key, data, savedAt: new Date().toISOString() });
}

export async function getPackEntry<T>(key: string): Promise<T | null> {
  const row = await offlineDb.pack.get(key);
  return row ? (row.data as T) : null;
}

export async function getPackSavedAt(key: string): Promise<string | null> {
  const row = await offlineDb.pack.get(key);
  return row?.savedAt ?? null;
}

/** The freshest saved-at time across the pack, for the status bar. */
export async function getPackFreshness(): Promise<string | null> {
  const rows = await offlineDb.pack.toArray();
  if (rows.length === 0) return null;
  return rows
    .map((r) => r.savedAt)
    .sort()
    .at(-1) ?? null;
}
