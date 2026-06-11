"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { taskLimit } from "@/lib/plans";

interface Task {
  id: string;
  title: string;
  done: boolean;
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");

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
        snapshot.docs.map((d) => ({
          id: d.id,
          title: d.data().title as string,
          done: Boolean(d.data().done),
        }))
      );
    });
  }, [user]);

  if (loading || !user) {
    return <p className="py-24 text-center text-slate-500">Loading…</p>;
  }

  const plan = profile?.plan ?? "free";
  const limit = taskLimit(plan);
  const atLimit = tasks.length >= limit;

  async function addTask(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || atLimit || !user) return;
    await addDoc(collection(clientDb(), "users", user.uid, "tasks"), {
      title: title.trim(),
      done: false,
      createdAt: serverTimestamp(),
    });
    setTitle("");
  }

  async function toggleTask(task: Task) {
    if (!user) return;
    await updateDoc(doc(clientDb(), "users", user.uid, "tasks", task.id), {
      done: !task.done,
    });
  }

  async function removeTask(id: string) {
    if (!user) return;
    await deleteDoc(doc(clientDb(), "users", user.uid, "tasks", id));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your tasks</h1>
        <span className="text-sm text-slate-500">
          {tasks.length}
          {Number.isFinite(limit) ? ` / ${limit}` : ""} tasks
        </span>
      </div>

      <form onSubmit={addTask} className="mt-6 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={atLimit ? "Task limit reached" : "What needs doing?"}
          disabled={atLimit}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={atLimit || !title.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {atLimit && plan === "free" && (
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="font-medium text-indigo-900">
            You&apos;ve hit the free plan limit of {limit} tasks.
          </p>
          <p className="mt-1 text-sm text-indigo-700">
            Upgrade to Pro for unlimited tasks.
          </p>
          <div className="mt-4 max-w-xs">
            <UpgradeButton />
          </div>
        </div>
      )}

      <ul className="mt-8 space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(task)}
              className="h-4 w-4 accent-indigo-600"
            />
            <span
              className={`flex-1 ${
                task.done ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {task.title}
            </span>
            <button
              onClick={() => removeTask(task.id)}
              className="text-sm text-slate-400 hover:text-red-600"
              aria-label={`Delete ${task.title}`}
            >
              ✕
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            No tasks yet — add your first one above.
          </li>
        )}
      </ul>
    </div>
  );
}
