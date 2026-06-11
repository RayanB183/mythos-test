import Link from "next/link";
import { PLANS } from "@/lib/plans";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold tracking-tight text-slate-900">
          Get your tasks out of your head and{" "}
          <span className="text-indigo-600">into flow</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
          TaskFlow is the simplest way to capture, organize, and finish your
          work. Start free — upgrade when you need more.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Start for free
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-white"
          >
            View pricing
          </Link>
        </div>
      </section>

      <section className="grid gap-6 pb-24 sm:grid-cols-3">
        {[
          {
            title: "Capture instantly",
            body: "Add tasks in one keystroke. No setup, no friction, no excuses.",
          },
          {
            title: "Synced everywhere",
            body: "Real-time sync powered by Firebase. Your list is always up to date.",
          },
          {
            title: `Pro for ${PLANS.pro.price}/mo`,
            body: "Unlimited tasks and priority support. Cancel anytime with one click.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <h3 className="font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
