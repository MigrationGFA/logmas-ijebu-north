import { OfflineQueueManager } from "@/components/offline/OfflineQueueManager";

/**
 * Field officer offline queue: the records captured on this device,
 * waiting, incomplete, failed and synced.
 */
export default function OfflineQueuePage() {
  return <OfflineQueueManager />;
}
