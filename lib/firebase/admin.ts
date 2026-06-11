import "server-only";

import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp(): App {
  if (getApps().length) return getApp();
  return initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "mythos-test-91fb1",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Env vars store the key with literal "\n"; restore real newlines.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export function adminAuth() {
  return getAuth(adminApp());
}

export function adminDb() {
  return getFirestore(adminApp());
}

/**
 * Verifies the Firebase ID token from an Authorization: Bearer header.
 * Returns the decoded token, or null if missing/invalid.
 */
export async function verifyRequest(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    return await adminAuth().verifyIdToken(match[1]);
  } catch {
    return null;
  }
}
