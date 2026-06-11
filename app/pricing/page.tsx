"use client";

import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { useAuth } from "@/components/AuthProvider";
import UpgradeButton from "@/components/UpgradeButton";

export default function PricingPage() {
  const { profile } = useAuth();
  const isPro = profile?.plan === "pro";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-center text-4xl font-bold text-slate-900">
        Simple, honest pricing
      </h1>
      <p className="mt-4 text-center text-slate-600">
        Start free. Upgrade when you outgrow it.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-semibold">{PLANS.free.name}</h2>
          <p className="mt-2 text-4xl font-bold">
            {PLANS.free.price}
            <span className="text-base font-normal text-slate-500">/month</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {PLANS.free.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-indigo-600">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-8 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center font-medium text-slate-700 hover:bg-slate-50"
          >
            Get started
          </Link>
        </div>

        <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
            MOST POPULAR
          </span>
          <h2 className="text-xl font-semibold">{PLANS.pro.name}</h2>
          <p className="mt-2 text-4xl font-bold">
            {PLANS.pro.price}
            <span className="text-base font-normal text-slate-500">/month</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {PLANS.pro.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-indigo-600">✓</span> {f}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {isPro ? (
              <p className="rounded-lg bg-indigo-50 px-4 py-2.5 text-center font-medium text-indigo-700">
                You&apos;re on Pro 🎉
              </p>
            ) : (
              <UpgradeButton />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
