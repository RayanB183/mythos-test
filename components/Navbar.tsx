"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase/client";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const { user, profile } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(clientAuth());
    router.push("/");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Up<span className="text-indigo-600">kept</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-slate-600 hover:text-slate-900">
            Pricing
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/account" className="text-slate-600 hover:text-slate-900">
                Account
              </Link>
              {profile?.plan === "pro" && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  PRO
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
