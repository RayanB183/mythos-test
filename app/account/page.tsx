"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import UpgradeButton from "@/components/UpgradeButton";
import { PLANS } from "@/lib/plans";

export default function AccountPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="py-24 text-center text-slate-500">Loading…</p>;
  }

  const plan = profile?.plan ?? "free";

  async function openPortal() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not open billing portal");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Account</h1>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Profile</h2>
        <p className="mt-2 text-sm text-slate-600">{user.email}</p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Subscription</h2>
        <p className="mt-2 text-sm text-slate-600">
          Current plan:{" "}
          <span className="font-medium text-slate-900">{PLANS[plan].name}</span>
          {profile?.cancelAtPeriodEnd && profile.currentPeriodEnd && (
            <span className="ml-2 text-amber-600">
              (cancels{" "}
              {new Date(profile.currentPeriodEnd * 1000).toLocaleDateString()})
            </span>
          )}
        </p>

        <div className="mt-4 max-w-xs">
          {plan === "pro" || profile?.stripeCustomerId ? (
            <button
              onClick={openPortal}
              disabled={busy}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {busy ? "Opening…" : "Manage billing"}
            </button>
          ) : (
            <UpgradeButton />
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
