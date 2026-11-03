"use client";

/**
 * The officer's offline status, shown in the dashboard header for field
 * officers only: connection state, when the offline pack was saved, how
 * many records are waiting on this phone, and a Sync Now button.
 *
 * Tapping the waiting count opens the queue screen. Nothing about
 * payments appears here, because offline capture has no payment step.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CloudOff, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tokenManager } from "@/services/apiAuth";
import { OFFLINE_QUEUE_EVENT } from "@/lib/offline/db";
import { countWaiting } from "@/lib/offline/queue";
import { getPackFreshness } from "@/lib/offline/pack";
import { syncAllForOfficer } from "@/lib/offline/syncEngine";

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OfflineStatusBar() {
  const [officerId, setOfficerId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [waiting, setWaiting] = useState(0);
  const [packSavedAt, setPackSavedAt] = useState<string | null>(null);
  const [syncingNow, setSyncingNow] = useState(false);

  const refresh = useCallback(async (id: string) => {
    setOnline(navigator.onLine);
    setWaiting(await countWaiting(id));
    setPackSavedAt(await getPackFreshness());
  }, []);

  useEffect(() => {
    const user = tokenManager.getUser();
    if (!user || user.role !== "field_officer") return;
    setOfficerId(user.id);
    void refresh(user.id);

    const onQueueChange = () => void refresh(user.id);
    const onOnline = () => void refresh(user.id);
    const onOffline = () => setOnline(false);
    window.addEventListener(OFFLINE_QUEUE_EVENT, onQueueChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const timer = window.setInterval(onQueueChange, 15000);
    return () => {
      window.removeEventListener(OFFLINE_QUEUE_EVENT, onQueueChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(timer);
    };
  }, [refresh]);

  if (!officerId) return null;

  const handleSyncNow = async () => {
    setSyncingNow(true);
    try {
      await syncAllForOfficer(officerId);
    } finally {
      setSyncingNow(false);
      void refresh(officerId);
    }
  };

  const packLabel = formatTime(packSavedAt);

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex"
        title={
          packLabel
            ? `Offline pack saved ${packLabel}`
            : "No offline pack saved yet. Open the dashboard while online."
        }
      >
        {online ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-amber-600" />
        )}
        {online ? "Online" : "Offline"}
        {packLabel ? (
          <span className="hidden xl:inline">· Pack {packLabel}</span>
        ) : (
          <span className="hidden items-center gap-1 text-amber-600 xl:flex">
            <CloudOff className="h-3.5 w-3.5" /> No pack yet
          </span>
        )}
      </span>

      <Link href="/dashboard/offline-queue" aria-label="Open the offline queue">
        <Badge
          variant={waiting > 0 ? "default" : "outline"}
          className="cursor-pointer"
        >
          {waiting} waiting
        </Badge>
      </Link>

      <Button
        size="sm"
        variant="outline"
        className="h-8"
        disabled={!online || waiting === 0 || syncingNow}
        onClick={handleSyncNow}
      >
        <RefreshCw
          className={`mr-1.5 h-3.5 w-3.5 ${syncingNow ? "animate-spin" : ""}`}
        />
        Sync now
      </Button>
    </div>
  );
}
