import Link from "next/link";
import { PLANS } from "@/lib/plans";

const demoDeals = [
  { brand: "Glow Cosmetics", amount: "$1,500", note: "⚠ 12 days late", warn: true },
  { brand: "TechBox", amount: "$850", note: "Payment due in 6 days", warn: false },
  { brand: "FitFuel", amount: "$2,000", note: "Invoiced · net 60", warn: false },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200 via-violet-200 to-transparent opacity-60 blur-3xl"
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="animate-fade-in-up inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              87% of creators have been paid late, paid wrong, or not paid at all
            </p>
            <h1 className="animate-fade-in-up animation-delay-100 mt-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
              Know exactly what every brand owes you —{" "}
              <span className="text-gradient animate-gradient-pan">
                and who&apos;s late
              </span>
            </h1>
            <p className="animate-fade-in-up animation-delay-200 mt-6 max-w-lg text-lg text-slate-600">
              Paydar tracks your brand deals from pitch to paid. The moment you
              invoice, it starts the clock on the payment terms — so net-60
              never quietly becomes net-never.
            </p>
            <div className="animate-fade-in-up animation-delay-300 mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="hover-lift animate-pulse-ring rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
              >
                Track my deals — free
              </Link>
              <Link
                href="/pricing"
                className="hover-lift rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700"
              >
                View pricing
              </Link>
            </div>
          </div>

          {/* Floating demo cards */}
          <div className="relative hidden lg:block" aria-hidden>
            <div className="animate-scale-in animation-delay-300 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Owed to you
                </p>
                <p className="text-3xl font-extrabold text-slate-900">$4,350</p>
              </div>
              <div className="mt-5 space-y-3">
                {demoDeals.map((d, i) => (
                  <div
                    key={d.brand}
                    className={`animate-fade-in-up flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 ${
                      i === 0 ? "animation-delay-400" : "animation-delay-500"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {d.brand}
                      </p>
                      <p
                        className={`text-xs ${
                          d.warn
                            ? "font-medium text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {d.note}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {d.amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-float absolute -right-6 -top-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold text-red-700">
                ⚠ Glow Cosmetics is 12 days late — follow up today
              </p>
            </div>
            <div className="animate-float-slow absolute -bottom-6 -left-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold text-emerald-800">
                ✓ TravelNest paid $1,200 · on time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem stats */}
      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 text-center sm:grid-cols-3">
          {[
            ["87%", "of creators have been paid late, wrong, or never"],
            ["40%", "say chasing payments is one of the hardest parts of the job"],
            ["net 90", "payment terms are becoming the industry norm"],
          ].map(([stat, label], i) => (
            <div
              key={label}
              className={`animate-fade-in-up ${
                i === 1 ? "animation-delay-100" : i === 2 ? "animation-delay-200" : ""
              }`}
            >
              <p className="text-4xl font-extrabold text-indigo-600">{stat}</p>
              <p className="mt-2 text-sm text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="animate-fade-in-up text-center text-3xl font-bold text-slate-900">
          Your deals, from pitch to paid
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "A pipeline built for deals",
              body: "Pitched, negotiating, signed, delivered, invoiced, paid. One click moves a deal forward — no spreadsheet gymnastics.",
            },
            {
              title: "Payment radar",
              body: "Invoice a deal and Paydar starts counting down the payment terms. The day a brand goes late, you know — with the receipts.",
            },
            {
              title: `Pro for ${PLANS.pro.price}/mo`,
              body: "Unlimited deals and your full earnings history. One rescued invoice pays for years of it.",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className={`hover-lift animate-fade-in-up rounded-xl border border-slate-200 bg-white p-6 ${
                i === 1 ? "animation-delay-100" : i === 2 ? "animation-delay-200" : ""
              }`}
            >
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="animate-fade-in-up mt-16 text-center">
          <Link
            href="/signup"
            className="hover-lift inline-block rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Find out who owes you money
          </Link>
        </div>
      </section>
    </div>
  );
}
