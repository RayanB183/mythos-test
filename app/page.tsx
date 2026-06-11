import Link from "next/link";
import { PLANS } from "@/lib/plans";

const demoSubscriptions = [
  { name: "Streamio Premium", cost: "$15.99", note: "Renews in 3 days", warn: true },
  { name: "CloudDrive 2TB", cost: "$9.99", note: "Renews in 12 days", warn: false },
  { name: "FitTrack Pro", cost: "$12.99", note: "Unused for 2 months", warn: true },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-24">
        {/* Decorative gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200 via-violet-200 to-transparent opacity-60 blur-3xl"
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="animate-fade-in-up inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              The average person wastes $1,600/year on forgotten subscriptions
            </p>
            <h1 className="animate-fade-in-up animation-delay-100 mt-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
              Stop paying for subscriptions{" "}
              <span className="text-gradient animate-gradient-pan">
                you forgot about
              </span>
            </h1>
            <p className="animate-fade-in-up animation-delay-200 mt-6 max-w-lg text-lg text-slate-600">
              Renewly puts every recurring charge in one place — see exactly
              what you spend each month, and get a countdown before anything
              renews, so you cancel before you&apos;re billed.
            </p>
            <div className="animate-fade-in-up animation-delay-300 mt-10 flex items-center gap-4">
              <Link
                href="/signup"
                className="hover-lift animate-pulse-ring rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
              >
                Track my subscriptions — free
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
                  Monthly spend
                </p>
                <p className="text-3xl font-extrabold text-slate-900">$38.97</p>
              </div>
              <div className="mt-5 space-y-3">
                {demoSubscriptions.map((s, i) => (
                  <div
                    key={s.name}
                    className={`animate-fade-in-up flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 ${
                      i === 0 ? "animation-delay-400" : "animation-delay-500"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {s.name}
                      </p>
                      <p
                        className={`text-xs ${
                          s.warn ? "text-amber-600" : "text-slate-500"
                        }`}
                      >
                        {s.note}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{s.cost}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-float absolute -right-6 -top-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold text-amber-800">
                ⚠ FitTrack renews tomorrow — $12.99
              </p>
            </div>
            <div className="animate-float-slow absolute -bottom-6 -left-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold text-emerald-800">
                ✓ Cancelled 3 subscriptions · saved $312/yr
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem stats */}
      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 text-center sm:grid-cols-3">
          {[
            ["12", "subscriptions held by the average household"],
            ["42%", "of people pay for a service they no longer use"],
            ["$133", "wasted per month on forgotten renewals"],
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
          Everything in one dashboard
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "See your true spend",
              body: "Every recurring charge totalled into a real monthly and yearly number. Most people are shocked the first time.",
            },
            {
              title: "Never miss a renewal",
              body: "Live countdowns flag anything renewing in the next 7 days, so you cancel before the charge — not after.",
            },
            {
              title: `Pro for ${PLANS.pro.price}/mo`,
              body: "Unlimited subscriptions and spend insights. Renewly pays for itself the first time you catch one renewal.",
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
            Find out what you&apos;re really spending
          </Link>
        </div>
      </section>
    </div>
  );
}
