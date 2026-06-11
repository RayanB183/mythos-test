"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { clientAuth, clientDb, firebaseConfigured, initAnalytics } from "@/lib/firebase/client";
import type { Plan } from "@/lib/plans";

export interface UserProfile {
  plan: Plan;
  subscriptionStatus?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number;
  stripeCustomerId?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    initAnalytics();
    return onAuthStateChanged(clientAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    return onSnapshot(doc(clientDb(), "users", user.uid), (snapshot) => {
      const data = snapshot.data();
      setProfile({
        plan: data?.plan === "pro" ? "pro" : "free",
        subscriptionStatus: data?.subscriptionStatus,
        cancelAtPeriodEnd: data?.cancelAtPeriodEnd,
        currentPeriodEnd: data?.currentPeriodEnd,
        stripeCustomerId: data?.stripeCustomerId,
      });
    });
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!firebaseConfigured && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          <strong>Setup needed:</strong> Firebase environment variables are
          missing, so sign-in and data are disabled. Add the{" "}
          <code>NEXT_PUBLIC_FIREBASE_*</code> values from{" "}
          <code>.env.example</code> to your deployment and redeploy.
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
