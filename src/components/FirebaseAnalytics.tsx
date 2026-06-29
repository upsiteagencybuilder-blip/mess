"use client";

import { useEffect } from "react";
import { getAnalyticsInstance } from "@/lib/firebase";

/**
 * Initializes Firebase Analytics on the client side after mount.
 * Analytics requires `window`, so it must run in the browser only —
 * this client component handles that safely.
 */
export default function FirebaseAnalytics() {
  useEffect(() => {
    void getAnalyticsInstance();
  }, []);

  return null;
}
