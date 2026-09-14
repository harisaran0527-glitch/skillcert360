"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/password-field";
import { GraduationCap, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export function StudentLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    setPending(true);
    setError(undefined);

    try {
      const form = e.currentTarget;
      const body = new URLSearchParams(new FormData(form) as unknown as URLSearchParams).toString();

      const res = await fetch("/api/auth/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        redirect: "manual",
      });

      if (res.type === "opaqueredirect" || res.status === 0) {
        // Browser-blocked opaque redirect — fall back to native submit
        form.submit();
        return;
      }

      if (res.status >= 200 && res.status < 400) {
        // Success redirect — follow the location
        const location = res.headers.get("location");
        if (location) {
          // Check if error is in the redirect location
          const redirectUrl = new URL(location, window.location.origin);
          const errorParam = redirectUrl.searchParams.get("error");
          if (errorParam) {
            setError(errorParam);
            setPending(false);
            return;
          }
          // Success — navigate
          router.push(redirectUrl.pathname + redirectUrl.search);
          // Keep spinner on while navigating
          return;
        }
      }

      // Unexpected status
      setError("Login failed. Please try again.");
      setPending(false);
    } catch {
      setError("Network error. Please check your connection.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Email or Register Number
        </label>
        <input
          name="identifier"
          required
          disabled={pending}
          placeholder="student@institution.edu or REG-1002"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <PasswordField variant="dark" disabled={pending} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait cursor-pointer"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            Signing in...
          </>
        ) : (
          <>
            Sign In to Learning Dashboard <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition"
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Switch to Administrator Portal
        </Link>
      </div>
    </form>
  );
}
