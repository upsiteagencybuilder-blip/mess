import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics, logEvent } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCG2TaMuD03fjjEU-ncER4BJCeOI0ZP_h4",
  authDomain: "mess-a4049.firebaseapp.com",
  projectId: "mess-a4049",
  storageBucket: "mess-a4049.firebasestorage.app",
  messagingSenderId: "460228567709",
  appId: "1:460228567709:web:de3f82b85df9bd722aea74",
  measurementId: "G-WQNMCLD8SN",
};

// Initialize Firebase app (safe on both server & client)
let app: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

/**
 * Initialize Firebase Analytics. Only runs in the browser (analytics needs
 * `window` and `document`). On the server this returns null.
 */
export async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  try {
    getFirebaseApp();
    const supported = await isSupported();
    if (!supported) return null;
    analyticsInstance = getAnalytics(getFirebaseApp());
    return analyticsInstance;
  } catch (e) {
    console.error("Firebase Analytics init failed", e);
    return null;
  }
}

// Eagerly init the app so it's ready immediately
getFirebaseApp();

/**
 * Log a custom event to Firebase Analytics. Safe to call from anywhere —
 * if Analytics isn't initialized yet (e.g. during SSR), it's a no-op.
 */
export function logAnalyticsEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  void getAnalyticsInstance().then((analytics) => {
    if (analytics) {
      try {
        logEvent(analytics, eventName, params);
      } catch (e) {
        console.error("Firebase logEvent failed", e);
      }
    }
  });
}

export { firebaseConfig };
export default getFirebaseApp;
