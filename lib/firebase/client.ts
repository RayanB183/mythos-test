"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase web config is public by design (it ships in the JS bundle),
// so it's baked in here. Env vars still take precedence, which lets a
// staging deployment point at a different Firebase project.
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyBJN0ZFTnKZOkQKE9bleniPHKBOMu759GQ",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "mythos-test-91fb1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "mythos-test-91fb1",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "mythos-test-91fb1.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "237775013635",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:237775013635:web:7c363a908928c727e94b36",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-ZCGBS79KCL",
};

/**
 * True once the required Firebase config values are present.
 * Lets the UI degrade to a setup notice instead of crashing when the
 * app is deployed without configuration.
 */
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

function app(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function clientAuth(): Auth {
  return getAuth(app());
}

export function clientDb(): Firestore {
  return getFirestore(app());
}

/**
 * Initializes Firebase Analytics in supported browsers. Safe to call
 * unconditionally; it no-ops during SSR and in unsupported environments.
 */
export async function initAnalytics(): Promise<void> {
  if (!firebaseConfigured || typeof window === "undefined") return;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) getAnalytics(app());
  } catch {
    // Analytics is best-effort; never let it break the app.
  }
}
