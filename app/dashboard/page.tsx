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
import { taskLimit } from "@/lib/plans";
import {
  CATEGORIES,
  FREQUENCIES,
  PRESETS,
  nextDueFrom,
  type Category,
  type Frequency,
} from "@/lib/maintenance";

interface Task {
  id: string;
  name: string;
  category: Category;
  frequency: Frequency;
  nextDue: string; // ISO date (yyyy-mm-dd)
}

const DAY_MS = 86_400_000;

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(isoDate).getTime() - today.getTime()) / DAY_MS);
}

function StatCard({
  label,
  value,
  suffix = "",
  highlight = false,
  delayClass = "",
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
  delayClass?: string;
}) {
  const animated = useCountUp(value);
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
        {Math.round(animated)}
        {suffix}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("hvac");
  const [frequency, setFrequency] = useState<Frequency>("quarterly");
  const [nextDue, setNextDue] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(clientDb(), "users", user.uid, "tasks"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      setTasks(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name as string,
            category: (data.category in CATEGORIES ? data.category : "exterior") as Category,
            frequency: (data.frequency in FREQUENCIES
              ? data.frequency
              : "yearly") as Frequency,
            nextDue: (data.nextDue as string) ?? "",
          };
        })
      );
    });
  }, [user]);

  const sorted = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
      ),
    [tasks]
  );

  const overdue = useMemo(
    () => tasks.filter((t) => daysUntil(t.nextDue) < 0).length,
    [tasks]
  );
  const dueSoon = useMemo(
    () =>
      tasks.filter((t) => {
        const d = daysUntil(t.nextDue);
        return d >= 0 && d <= 30;
      }).length,
    [tasks]
  );
  const healthScore = tasks.length
    ? Math.round(((tasks.length - overdue) / tasks.length) * 100)
    : 100;

  if (loading || !user) {
    return <p className="py-24 text-center text-slate-500">Loading…</p>;
  }

  const plan = profile?.plan ?? "free";
  const limit = taskLimit(plan);
  const atLimit = tasks.length >= limit;
  const existingNames = new Set(tasks.map((t) => t.name));
  const availablePresets = PRESETS.filter((p) => !existingNames.has(p.name));

  async function addTask(
    taskName: string,
    taskCategory: Category,
    taskFrequency: Frequency,
    due: string
  ) {
    if (!user || atLimit || !taskName.trim() || !due) return;
    await addDoc(collection(clientDb(), "users", user.uid, "tasks"), {
      name: taskName.trim(),
      category: taskCategory,
      frequency: taskFrequency,
      nextDue: due,
      createdAt: serverTimestamp(),
    });
  }

  async function handleAddCustom(e: FormEvent) {
    e.preventDefault();
    await addTask(name, category, frequency, nextDue);
    setName("");
    setNextDue("");
  }

  async function addPreset(preset: (typeof PRESETS)[number]) {
    await addTask(
      preset.name,
      preset.category,
      preset.frequency,
      nextDueFrom(new Date(), preset.frequency)
    );
  }

  async function markDone(task: Task) {
    if (!user) return;
    await updateDoc(doc(clientDb(), "users", user.uid, "tasks", task.id), {
      nextDue: nextDueFrom(new Date(), task.frequency),
      lastDone: new Date().toISOString().slice(0, 10),
    });
  }

  async function removeTask(id: string) {
    if (!user) return;
    setRemovingId(id);
    // Let the exit transition play before the snapshot removes the row.
    await new Promise((r) => setTimeout(r, 250));
    await deleteDoc(doc(clientDb(), "users", user.uid, "tasks", id));
    setRemovingId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="animate-fade-in-up flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your home</h1>
        <span className="text-sm text-slate-500">
          {tasks.length}
          {Number.isFinite(limit) ? ` / ${limit}` : ""} tasks
        </span>
      </div>

      {/* Health summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Home health" value={healthScore} suffix="%" />
        <StatCard
          label="Overdue"
          value={overdue}
          highlight
          delayClass="animation-delay-100"
        />
        <StatCard
          label="Due in 30 days"
          value={dueSoon}
          delayClass="animation-delay-200"
        />
      </div>

      {/* One-click presets */}
      {availablePresets.length > 0 && !atLimit && (
        <div className="animate-fade-in-up animation-delay-200 mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick add — tasks most homes need
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {availablePresets.slice(0, 8).map((p) => (
              <button
                key={p.name}
                onClick={() => addPreset(p)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-all hover:border-indigo-400 hover:bg-indigo-50 active:scale-95"
              >
                {CATEGORIES[p.category].emoji} {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom task form */}
      <form
        onSubmit={handleAddCustom}
        className="animate-fade-in-up animation-delay-300 mt-6 grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_8rem_9rem_10rem_auto]"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={atLimit ? "Plan limit reached" : "Custom task…"}
          disabled={atLimit}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          disabled={atLimit}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        >
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <option key={key} value={key}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
          disabled={atLimit}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        >
          {Object.entries(FREQUENCIES).map(([key, f]) => (
            <option key={key} value={key}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          value={nextDue}
          onChange={(e) => setNextDue(e.target.value)}
          type="date"
          disabled={atLimit}
          aria-label="Next due date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={atLimit || !name.trim() || !nextDue}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {atLimit && plan === "free" && (
        <div className="animate-scale-in mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="font-medium text-indigo-900">
            You&apos;ve hit the free plan limit of {limit} tasks.
          </p>
          <p className="mt-1 text-sm text-indigo-700">
            A full home schedule has 20+. Upgrade to Pro — one avoided repair
            pays for years of it.
          </p>
          <div className="mt-4 max-w-xs">
            <UpgradeButton />
          </div>
        </div>
      )}

      {/* Task list, soonest due first */}
      <ul className="mt-8 space-y-2">
        {sorted.map((task, i) => {
          const days = daysUntil(task.nextDue);
          const isOverdue = days < 0;
          const soon = days >= 0 && days <= 14;
          return (
            <li
              key={task.id}
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              className={`animate-fade-in-up flex items-center gap-4 rounded-xl border bg-white px-4 py-3 transition-all duration-300 ${
                isOverdue
                  ? "border-red-300"
                  : soon
                    ? "border-amber-300"
                    : "border-slate-200"
              } ${
                removingId === task.id
                  ? "translate-x-6 scale-95 opacity-0"
                  : "opacity-100"
              }`}
            >
              <span className="text-xl" title={CATEGORIES[task.category].label}>
                {CATEGORIES[task.category].emoji}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{task.name}</p>
                <p
                  className={`text-xs ${
                    isOverdue
                      ? "font-medium text-red-600"
                      : soon
                        ? "font-medium text-amber-600"
                        : "text-slate-500"
                  }`}
                >
                  {isOverdue
                    ? `⚠ Overdue by ${-days} day${days === -1 ? "" : "s"}`
                    : days === 0
                      ? "Due today"
                      : `Due in ${days} day${days === 1 ? "" : "s"}`}{" "}
                  · {FREQUENCIES[task.frequency].label.toLowerCase()}
                </p>
              </div>
              <button
                onClick={() => markDone(task)}
                className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-50 active:scale-95"
                title={`Reschedules ${FREQUENCIES[task.frequency].label.toLowerCase()}`}
              >
                ✓ Done
              </button>
              <button
                onClick={() => removeTask(task.id)}
                className="text-sm text-slate-400 transition-colors hover:text-red-600"
                aria-label={`Remove ${task.name}`}
              >
                ✕
              </button>
            </li>
          );
        })}
        {tasks.length === 0 && (
          <li className="animate-fade-in rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            No tasks yet. Start with the quick-add presets above — most homes
            are overdue on at least three of them.
          </li>
        )}
      </ul>
    </div>
  );
}
