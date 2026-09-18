"use client";

import { PasswordField } from "@/components/password-field";
import { ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AdminLoginForm({ initialError }: { initialError?: string }) {
  return (
    <form action="/api/auth/admin/login" method="post" className="space-y-5">
      {initialError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{initialError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300" htmlFor="admin-email">
          Administrator Email
        </label>
        <input
          id="admin-email"
          name="identifier"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@institution.edu"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          Password
        </label>
        <PasswordField variant="dark" />
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98] cursor-pointer"
      >
        Sign In to Admin Portal
        <ArrowRight className="w-4 h-4" />
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
