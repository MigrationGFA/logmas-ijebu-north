import type { MetadataRoute } from "next";
import { LGA_CONFIG } from "@/config/lga.config";

/**
 * Web app manifest, so field officers can install LOGMAS on their Android
 * phones and open it like a native app. Paired with public/sw.js, this is
 * what makes offline capture possible. Names come from the LGA config, so
 * a cloned deployment for another LGA installs under its own name.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${LGA_CONFIG.identity.fullName} - LOGMAS`,
    short_name: "LOGMAS",
    description:
      "Local Government Management and Automation System. Field officers can capture applications offline and sync when network returns.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#14532d",
    icons: [
      {
        src: "/favicon_io/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon_io/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
