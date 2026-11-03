"use client";

/**
 * Offline runtime for field officers. Renders nothing.
 *
 * Mounted once inside the dashboard layout. For a signed in field officer
 * it:
 * 1. Registers the service worker (public/sw.js), which is what lets the
 *    app open at all with no network.
 * 2. Saves the offline reference pack (services, wards, profile) whenever
 *    the dashboard loads with a connection.
 * 3. Runs the sync engine when the browser comes back online, when the
 *    app opens, and when the service worker reports a background sync.
 *
 * Other roles render nothing and register nothing: offline capture is a
 * field officer feature.
 */
import { useEffect } from "react";
import { tokenManager } from "@/services/apiAuth";
import { services } from "@/services/apiServices";
import { wardsService } from "@/services/apiWard";
import { savePackEntry, PACK_KEYS } from "@/lib/offline/pack";
import { syncAllForOfficer } from "@/lib/offline/syncEngine";
import { warmOfflineRoutes } from "@/lib/offline/warm";

export function OfflineRuntime() {
  useEffect(() => {
    const user = tokenManager.getUser();
    if (!user || user.role !== "field_officer") return;
    const officerId = user.id;
    let cancelled = false;

    async function registerServiceWorker() {
      if (!("serviceWorker" in navigator)) return;
      // Production builds only. A service worker under `next dev` fights
      // the dev server's constant rebuilds (stale cached pages against
      // fresh chunk URLs) and can throw the app into a reload loop, which
      // is a known dev mode trap rather than an app bug. Any worker an
      // earlier dev session registered is removed, so a machine that hit
      // that loop recovers simply by loading the dashboard once in dev.
      // Offline behaviour is tested on a production build, which is also
      // what officers actually run.
      if (process.env.NODE_ENV !== "production") {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map((registration) => registration.unregister()),
          );
        } catch {
          // Nothing to clean up.
        }
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        // Best effort background sync registration. Chromium supports it;
        // browsers that do not simply rely on the online event and on the
        // officer opening the app.
        const reg = registration as unknown as {
          sync?: { register: (tag: string) => Promise<void> };
        };
        await reg.sync?.register("logmas-offline-sync").catch(() => undefined);
      } catch {
        // The app still works online without the worker. Offline capture
        // needs it, so the status bar surfaces whether the pack is saved.
      }
    }

    async function refreshPack() {
      if (!navigator.onLine || cancelled) return;
      try {
        const [serviceList, wardList] = await Promise.allSettled([
          services.listServices(),
          wardsService.getWardsList(),
        ]);
        if (serviceList.status === "fulfilled") {
          await savePackEntry(PACK_KEYS.services, serviceList.value);
          // Warm every service form page into the service worker caches,
          // so a network drop before the officer ever opened a form does
          // not lock that form away. Runs in the background, once.
          void warmOfflineRoutes(
            serviceList.value as unknown as Array<{ id?: string }>,
          );
        }
        if (wardList.status === "fulfilled") {
          await savePackEntry(PACK_KEYS.wards, wardList.value);
        }
        await savePackEntry(PACK_KEYS.profile, {
          id: user!.id,
          email: user!.email,
          firstName: user!.firstName,
          lastName: user!.lastName,
          role: user!.role,
          wardId: (user as unknown as { wardId?: string | null }).wardId ?? null,
        });
      } catch {
        // A failed pack refresh must never break the dashboard. The last
        // saved pack stays in place.
      }
    }

    function handleOnline() {
      void refreshPack();
      void syncAllForOfficer(officerId);
    }

    function handleServiceWorkerMessage(event: MessageEvent) {
      if ((event.data as { type?: string })?.type === "LOGMAS_SYNC_REQUESTED") {
        void syncAllForOfficer(officerId);
      }
    }

    void registerServiceWorker();
    void refreshPack();
    if (navigator.onLine) void syncAllForOfficer(officerId);

    window.addEventListener("online", handleOnline);
    navigator.serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );
    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    };
  }, []);

  return null;
}
