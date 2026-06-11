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
  updateDoc,
} from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import UpgradeButton from "@/components/UpgradeButton";
import { useCountUp } from "@/components/useCountUp";
import { dealLimit } from "@/lib/plans";
import {
  STATUSES,
  PAYMENT_TERMS,
  addDays,
  daysUntil,
  todayIso,
  type Status,
} from "@/lib/deals";

interface Deal {
  id: string;
  brand: string;
  deliverable: string;
  amount: number;
  status: Status;
  termsDays: number;
  contentDue: string; // ISO date
  invoicedAt: string | null; // ISO date, set when status reaches "invoiced"
}

function expectedPayDate(deal: Deal): string | null {
  return deal.invoicedAt ? addDays(deal.invoicedAt, deal.termsDays) : null;
}

function isLate(deal: Deal): boolean {
  if (deal.status !== "invoiced") return false;
  const due = expectedPayDate(deal);
  return due !== null && daysUntil(due) < 0;
}

function MoneyCard({
  label,
  value,
  highlight = false,
  delayClass = "",
}: {
  label: string;
  value: number;
  highlight?: boolean;
  delayClass?: string;
}) {
  const animated = useCountUp(value);
  return (
    <div
      className={`hover-lift animate-fade-in-up rounded-xl border bg-white p-5 ${delayClass} ${
        highlight && value > 0 ? "border-red-300 bg-red-50" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-extrabold tabular-nums ${
          highlight && value > 0 ? "text-red-600" : "text-slate-900"
        }`}
      >
        ${Math.round(animated).toLocaleString()}
      </p>
    </div>
  );
}

function paymentLine(deal: Deal): { text: string; tone: "red" | "amber" | "ok" | "muted" } {
  if (deal.status === "paid") {
    return { text: "Paid ✓", tone: "ok" };
  }
  if (deal.status === "invoiced") {
    const due = expectedPayDate(deal)!;
    const days = daysUntil(due);
    if (days < 0) {
      return {
        text: `⚠ ${-days} day${days === -1 ? "" : "s"} late — follow up`,
        tone: "red",
      };
    }
    return {
      text:
        days === 0
          ? "Payment due today"
          : `Payment due in ${days} day${days === 1 ? "" : "s"} (net ${deal.termsDays})`,
      tone: days <= 7 ? "amber" : "muted",
    };
  }
  if (deal.status === "delivered") {
    return { text: "Delivered — send your invoice", tone: "amber" };
  }
  const days = daysUntil(deal.contentDue);
  if (days < 0) {
    return {
      text: `Content was due ${-days} day${days === -1 ? "" : "s"} ago`,
      tone: "amber",
    };
  }
  return {
    text:
      days === 0
        ? "Content due today"
        : `Content due in ${days} day${days === 1 ? "" : "s"}`,
    tone: "muted",
  };
}

const TONE_CLASS = {
  red: "font-medium text-red-600",
  amber: "font-medium text-amber-600",
  ok: "font-medium text-emerald-600",
  muted: "text-slate-500",
} as const;

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [brand, setBrand] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [amount, setAmount] = useState("");
  const [termsDays, setTermsDays] = useState(30);
  const [contentDue, setContentDue] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(clientDb(), "users", user.uid, "deals"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      setDeals(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            brand: data.brand as string,
            deliverable: (data.deliverable as string) ?? "",
            amount: Number(data.amount) || 0,
            status: (data.status in STATUSES ? data.status : "pitched") as Status,
            termsDays: Number(data.termsDays) || 30,
            contentDue: (data.contentDue as string) ?? "",
            invoicedAt: (data.invoicedAt as string) ?? null,
          };
        })
      );
    });
  }, [user]);

  // Late payments first, then soonest deadline; paid deals sink to the bottom.
  const sorted = useMemo(() => {
    const rank = (d: Deal) =>
      d.status === "paid" ? 2 : isLate(d) ? 0 : 1;
    return [...deals].sort((a, b) => {
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const aDate = expectedPayDate(a) ?? a.contentDue;
      const bDate = expectedPayDate(b) ?? b.contentDue;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }, [deals]);

  const pipeline = useMemo(
    () =>
      deals
        .filter((d) => d.status !== "paid")
        .reduce((sum, d) => sum + d.amount, 0),
    [deals]
  );
  const awaiting = useMemo(
    () =>
      deals
        .filter((d) => d.status === "invoiced")
        .reduce((sum, d) => sum + d.amount, 0),
    [deals]
  );
  const overdue = useMemo(
    () => deals.filter(isLate).reduce((sum, d) => sum + d.amount, 0),
    [deals]
  );

  if (loading || !user) {
    return <p className="py-24 text-center text-slate-500">Loading…</p>;
  }

  const plan = profile?.plan ?? "free";
  const limit = dealLimit(plan);
  const activeCount = deals.filter((d) => d.status !== "paid").length;
  const atLimit = activeCount >= limit;

  async function addDeal(e: FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!user || atLimit || !brand.trim() || !(parsedAmount > 0) || !contentDue) {
      return;
    }
    await addDoc(collection(clientDb(), "users", user.uid, "deals"), {
      brand: brand.trim(),
      deliverable: deliverable.trim(),
      amount: parsedAmount,
      status: "pitched",
      termsDays,
      contentDue,
      invoicedAt: null,
      createdAt: serverTimestamp(),
    });
    setBrand("");
    setDeliverable("");
    setAmount("");
    setContentDue("");
  }

  async function advance(deal: Deal) {
    if (!user) return;
    const next = STATUSES[deal.status].next;
    if (!next) return;
    await updateDoc(doc(clientDb(), "users", user.uid, "deals", deal.id), {
      status: next,
      ...(next === "invoiced" && !deal.invoicedAt
        ? { invoicedAt: todayIso() }
        : {}),
      ...(next === "paid" ? { paidAt: todayIso() } : {}),
    });
  }

  async function removeDeal(id: string) {
    if (!user) return;
    setRemovingId(id);
    // Let the exit transition play before the snapshot removes the row.
    await new Promise((r) => setTimeout(r, 250));
    await deleteDoc(doc(clientDb(), "users", user.uid, "deals", id));
    setRemovingId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="animate-fade-in-up flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your deals</h1>
        <span className="text-sm text-slate-500">
          {activeCount}
          {Number.isFinite(limit) ? ` / ${limit}` : ""} active
        </span>
      </div>

      {/* Money summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MoneyCard label="In your pipeline" value={pipeline} />
        <MoneyCard
          label="Awaiting payment"
          value={awaiting}
          delayClass="animation-delay-100"
        />
        <MoneyCard
          label="Overdue"
          value={overdue}
          highlight
          delayClass="animation-delay-200"
        />
      </div>

      {/* Add deal form */}
      <form
        onSubmit={addDeal}
        className="animate-fade-in-up animation-delay-200 mt-8 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder={atLimit ? "Active deal limit reached" : "Brand name"}
          disabled={atLimit}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <input
          value={deliverable}
          onChange={(e) => setDeliverable(e.target.value)}
          placeholder="Deliverable (e.g. 1 Reel + 3 Stories)"
          disabled={atLimit}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Deal value ($)"
          disabled={atLimit}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <select
          value={termsDays}
          onChange={(e) => setTermsDays(Number(e.target.value))}
          disabled={atLimit}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        >
          {PAYMENT_TERMS.map((t) => (
            <option key={t} value={t}>
              Payment terms: net {t}
            </option>
          ))}
        </select>
        <input
          value={contentDue}
          onChange={(e) => setContentDue(e.target.value)}
          type="date"
          disabled={atLimit}
          aria-label="Content due date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={atLimit || !brand.trim() || !amount || !contentDue}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          Add deal
        </button>
      </form>

      {atLimit && plan === "free" && (
        <div className="animate-scale-in mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="font-medium text-indigo-900">
            You&apos;ve hit the free plan limit of {limit} active deals.
          </p>
          <p className="mt-1 text-sm text-indigo-700">
            Upgrade to Pro for unlimited deals — one rescued invoice covers
            years of it.
          </p>
          <div className="mt-4 max-w-xs">
            <UpgradeButton />
          </div>
        </div>
      )}

      {/* Deal list — late payments first */}
      <ul className="mt-8 space-y-2">
        {sorted.map((deal, i) => {
          const line = paymentLine(deal);
          const status = STATUSES[deal.status];
          return (
            <li
              key={deal.id}
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              className={`animate-fade-in-up flex items-center gap-4 rounded-xl border bg-white px-4 py-3 transition-all duration-300 ${
                line.tone === "red" ? "border-red-300" : "border-slate-200"
              } ${
                removingId === deal.id
                  ? "translate-x-6 scale-95 opacity-0"
                  : "opacity-100"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{deal.brand}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.chip}`}
                  >
                    {status.label}
                  </span>
                </div>
                <p className={`text-xs ${TONE_CLASS[line.tone]}`}>
                  {line.text}
                  {deal.deliverable && (
                    <span className="text-slate-400"> · {deal.deliverable}</span>
                  )}
                </p>
              </div>
              <p className="font-bold tabular-nums text-slate-900">
                ${deal.amount.toLocaleString()}
              </p>
              {status.advanceLabel && (
                <button
                  onClick={() => advance(deal)}
                  className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-all hover:bg-indigo-50 active:scale-95"
                >
                  {status.advanceLabel} →
                </button>
              )}
              <button
                onClick={() => removeDeal(deal.id)}
                className="text-sm text-slate-400 transition-colors hover:text-red-600"
                aria-label={`Remove deal with ${deal.brand}`}
              >
                ✕
              </button>
            </li>
          );
        })}
        {deals.length === 0 && (
          <li className="animate-fade-in rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            No deals yet. Add the one you&apos;re working on right now — even
            a pitch counts.
          </li>
        )}
      </ul>
    </div>
  );
}
