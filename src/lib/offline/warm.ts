/**
 * Cache warming for offline field work.
 *
 * The service worker precaches the app shell, but a service form page
 * only exists at a URL carrying a service id, and the browser only caches
 * what it has actually fetched. Without warming, an officer whose network
 * drops before they ever opened a particular form cannot open that form
 * offline. That is the realistic field case, so it is handled explicitly:
 *
 * While the officer is online, the dashboard takes the services list it
 * already fetched for the reference pack and, for every service, stores
 * that form page's HTML in the shell cache and the page's JavaScript and
 * CSS chunks in the asset cache, using the Cache Storage API, which the
 * page and the service worker share. The cache names below must match
 * public/sw.js.
 *
 * Warming is best effort and silent. Any URL that fails is skipped; the
 * officer's online work is never interrupted for the sake of a cache.
 */

const SHELL_CACHE = "logmas-v2-shell";
const ASSET_CACHE = "logmas-v2-assets";

interface WarmableService {
  id?: string;
}

let warmed = false;

function extractAssetUrls(html: string): string[] {
  const urls = new Set<string>();
  const pattern = /(?:src|href)="(\/_next\/static\/[^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    urls.add(match[1]);
  }
  return [...urls];
}

async function warmPage(url: string): Promise<void> {
  try {
    const shell = await caches.open(SHELL_CACHE);
    if (await shell.match(url)) return;
    const response = await fetch(url, { credentials: "same-origin" });
    if (!response.ok) return;
    const html = await response.clone().text();
    await shell.put(url, response);

    const assets = extractAssetUrls(html);
    if (assets.length > 0) {
      const assetCache = await caches.open(ASSET_CACHE);
      await Promise.allSettled(assets.map((asset) => assetCache.add(asset)));
    }
  } catch {
    // Offline mid-warm, or Cache Storage unavailable: skip this page.
  }
}

/**
 * Warm the field working set: every service form page, plus the permits
 * screen where violations are logged. Call once per session, while
 * online, after the services list has been fetched.
 */
export async function warmOfflineRoutes(
  services: WarmableService[],
): Promise<void> {
  if (warmed || typeof window === "undefined" || !("caches" in window)) {
    return;
  }
  if (!navigator.onLine) return;
  warmed = true;

  const urls = new Set<string>(["/dashboard/permits", "/dashboard/offline-queue"]);
  for (const service of services) {
    if (service?.id) urls.add(`/dashboard/services/${service.id}`);
  }

  // Sequential on purpose: a dozen small pages, warmed gently in the
  // background rather than as a burst competing with the officer's work.
  for (const url of urls) {
    await warmPage(url);
  }
}
