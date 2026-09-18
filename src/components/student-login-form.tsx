"use client";
import { PasswordField } from "@/components/password-field";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
export function StudentLoginForm({
  initialError,
}: {
  initialError?: string;
}) {
  return (
    <form
      action="/api/auth/student/login"
      method="post"
      className="mt-6 space-y-5"
    >
      {initialError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{initialError}</span>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Email or Register Number
        </label>
        <input
          name="identifier"
          required
          autoComplete="username"
          placeholder="student@institution.edu or REG-1002"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <PasswordField variant="dark" />
      </div>
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98] cursor-pointer"
      >
        Sign In to Learning Dashboard
        <ArrowRight className="w-4 h-4" />
      </button>
      <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Switch to Administrator Portal
        </Link>
      </div>
    </form>
  );
}