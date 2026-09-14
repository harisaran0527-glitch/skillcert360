"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/password-field";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export function AdminLoginForm({ initialError }: { initialError?: string }) {
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

      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        redirect: "manual",
      });

      if (res.type === "opaqueredirect" || res.status === 0) {
        form.submit();
        return;
      }

      if (res.status >= 200 && res.status < 400) {
        const location = res.headers.get("location");
        if (location) {
          const redirectUrl = new URL(location, window.location.origin);
          const errorParam = redirectUrl.searchParams.get("error");
          if (errorParam) {
            setError(errorParam);
            setPending(false);
            return;
          }
          router.push(redirectUrl.pathname + redirectUrl.search);
          return;
        }
      }

      setError("Login failed. Please try again.");
      setPending(false);
    } catch {
      setError("Network error. Please check your connection.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          name="identifier"
          type="email"
          required
          disabled={pending}
          autoComplete="email"
          placeholder="admin@example.com"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-60"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
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
          "Sign In"
        )}
      </button>

      <div className="pt-2 text-center">
        <Link
          href="/student/login"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition"
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Switch to Student Portal
        </Link>
      </div>
    </form>
  );
}
