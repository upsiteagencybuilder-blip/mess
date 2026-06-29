"use client";

import { useEffect } from "react";
import { getAnalyticsInstance } from "@/lib/firebase";
import { logAnalyticsEvent } from "@/lib/firebase";

/**
 * Initializes Firebase Analytics on the client side after mount.
 * Analytics requires `window`, so it must run in the browser only —
 * this client component handles that safely.
 *
 * Also listens for route/view changes and logs custom events so the
 * Firebase Console shows meaningful activity.
 */
export default function FirebaseAnalytics() {
  useEffect(() => {
    let initialized = false;
    (async () => {
      const analytics = await getAnalyticsInstance();
      if (analytics && !initialized) {
        initialized = true;
        // Log initial page view
        logAnalyticsEvent("page_view", {
          page_title: document.title,
          page_location: window.location.href,
        });
      }
    })();
  }, []);

  return null;
}
