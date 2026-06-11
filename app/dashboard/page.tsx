"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import UpgradeButton from "@/components/UpgradeButton";
import { useCountUp } from "@/components/useCountUp";
import { subscriptionLimit } from "@/lib/plans";

type Cycle = "monthly" | "yearly";

interface Subscription {
  id: string;
  name: string;
  cost: number;
  cycle: Cycle;
  nextRenewal: string; // ISO date (yyyy-mm-dd)
}

const DAY_MS = 86_400_000;

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(isoDate).getTime() - today.getTime()) / DAY_MS);
}

function monthlyCost(sub: Subscription): number {
  return sub.cycle === "monthly" ? sub.cost : sub.cost / 12;
}

function StatCard({
  label,
  value,
  prefix = "",
  highlight = false,
  delayClass = "",
}: {
  label: string;
  value: number;
  prefix?: string;
  highlight?: boolean;
  delayClass?: string;
}) {
  const animated = useCountUp(value);
  const display = prefix
    ? `${prefix}${animated.toFixed(2)}`
    : `${Math.round(animated)}`;
  return (
    <div
      className={`hover-lift animate-fade-in-up rounded-xl border bg-white p-5 ${delayClass} ${
        highlight && value > 0 ? "border-amber-300 bg-amber-50" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-extrabold tabular-nums ${
          highlight && value > 0 ? "text-amber-600" : "text-slate-900"
        }`}
      >
        {display}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [nextRenewal, setNextRenewal] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(clientDb(), "users", user.uid, "subscriptions"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      setSubs(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name as string,
            cost: Number(data.cost) || 0,
            cycle: data.cycle === "yearly" ? "yearly" : "monthly",
            nextRenewal: (data.nextRenewal as string) ?? "",
          };
        })
      );
    });
  }, [user]);

  const sorted = useMemo(
    () =>
      [...subs].sort(
        (a, b) =>
          new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime()
      ),
    [subs]
  );

  const totalMonthly = useMemo(
    () => subs.reduce((sum, s) => sum + monthlyCost(s), 0),
    [subs]
  );
  const renewingSoon = useMemo(
    () =>
      subs.filter((s) => {
        const d = daysUntil(s.nextRenewal);
        return d >= 0 && d <= 7;
      }).length,
    [subs]
  );

  if (loading || !user) {
    return <p className="py-24 text-center text-slate-500">Loading…</p>;
  }

  const plan = profile?.plan ?? "free";
  const limit = subscriptionLimit(plan);
  const atLimit = subs.length >= limit;

  async function addSubscription(e: FormEvent) {
    e.preventDefault();
    const parsedCost = parseFloat(cost);
    if (!name.trim() || !nextRenewal || !(parsedCost > 0) || atLimit || !user) {
      return;
    }
    await addDoc(collection(clientDb(), "users", user.uid, "subscriptions"), {
      name: name.trim(),
      cost: parsedCost,
      cycle,
      nextRenewal,
      createdAt: serverTimestamp(),
    });
    setName("");
    setCost("");
    setNextRenewal("");
  }

  async function removeSubscription(id: string) {
    if (!user) return;
    setRemovingId(id);
    // Let the exit transition play before the snapshot removes the row.
    await new Promise((r) => setTimeout(r, 250));
    await deleteDoc(doc(clientDb(), "users", user.uid, "subscriptions", id));
    setRemovingId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="animate-fade-in-up flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Your subscriptions
        </h1>
        <span className="text-sm text-slate-500">
          {subs.length}
          {Number.isFinite(limit) ? ` / ${limit}` : ""} tracked
        </span>
      </div>

      {/* Spend summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly spend" value={totalMonthly} prefix="$" />
        <StatCard
          label="Yearly spend"
          value={totalMonthly * 12}
          prefix="$"
          delayClass="animation-delay-100"
        />
        <StatCard
          label="Renewing in 7 days"
          value={renewingSoon}
          highlight
          delayClass="animation-delay-200"
        />
      </div>

      {/* Add form */}
      <form
        onSubmit={addSubscription}
        className="animate-fade-in-up animation-delay-200 mt-8 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_7rem_7.5rem_10rem_auto]"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={atLimit ? "Plan limit reached" : "Netflix, Spotify…"}
          disabled={atLimit}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <input
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Cost ($)"
          disabled={atLimit}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <select
          value={cycle}
          onChange={(e) => setCycle(e.target.value as Cycle)}
          disabled={atLimit}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        >
          <option value="monthly">per month</option>
          <option value="yearly">per year</option>
        </select>
        <input
          value={nextRenewal}
          onChange={(e) => setNextRenewal(e.target.value)}
          type="date"
          disabled={atLimit}
          aria-label="Next renewal date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={atLimit || !name.trim() || !cost || !nextRenewal}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {atLimit && plan === "free" && (
        <div className="animate-scale-in mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="font-medium text-indigo-900">
            You&apos;ve hit the free plan limit of {limit} subscriptions.
          </p>
          <p className="mt-1 text-sm text-indigo-700">
            Most people have 12+. Upgrade to Pro to track them all — it pays
            for itself the first renewal you catch.
          </p>
          <div className="mt-4 max-w-xs">
            <UpgradeButton />
          </div>
        </div>
      )}

      {/* Subscription list, soonest renewal first */}
      <ul className="mt-8 space-y-2">
        {sorted.map((sub, i) => {
          const days = daysUntil(sub.nextRenewal);
          const soon = days >= 0 && days <= 7;
          const overdue = days < 0;
          return (
            <li
              key={sub.id}
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              className={`animate-fade-in-up flex items-center gap-4 rounded-xl border bg-white px-4 py-3 transition-all duration-300 ${
                soon ? "border-amber-300" : "border-slate-200"
              } ${
                removingId === sub.id
                  ? "translate-x-6 scale-95 opacity-0"
                  : "opacity-100"
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{sub.name}</p>
                <p
                  className={`text-xs ${
                    overdue
                      ? "text-red-600"
                      : soon
                        ? "font-medium text-amber-600"
                        : "text-slate-500"
                  }`}
                >
                  {overdue
                    ? "Renewal date passed — update or cancel it"
                    : days === 0
                      ? "⚠ Renews today"
                      : days === 1
                        ? "⚠ Renews tomorrow"
                        : `Renews in ${days} days`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums text-slate-900">
                  ${sub.cost.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  {sub.cycle === "monthly" ? "/month" : "/year"}
                </p>
              </div>
              <button
                onClick={() => removeSubscription(sub.id)}
                className="text-sm text-slate-400 transition-colors hover:text-red-600"
                aria-label={`Remove ${sub.name}`}
                title="Cancelled it? Remove from tracking"
              >
                ✕
              </button>
            </li>
          );
        })}
        {subs.length === 0 && (
          <li className="animate-fade-in rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            No subscriptions tracked yet. Add your first one above — check
            your bank statement for recurring charges you forgot about.
          </li>
        )}
      </ul>
    </div>
  );
}
