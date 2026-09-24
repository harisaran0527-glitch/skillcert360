"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Search, ArrowRight, CheckCircle2 } from "lucide-react";

export default function CertificateVerificationSearchPage() {
  const [certId, setCertId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = certId.trim();
    if (!trimmed) {
      setError("Please enter a valid Certificate ID.");
      return;
    }
    setError("");
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="relative min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-12 overflow-hidden selection:bg-cyan-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-7 w-7" />
            </div>
            <span className="font-display text-3xl font-extrabold tracking-tight text-white">
              SkillCert <span className="text-cyan-400">360</span>
            </span>
          </Link>
          <p className="text-xs uppercase tracking-widest font-semibold text-cyan-400">
            Official Credential & Certificate Verification Platform
          </p>
        </div>

        {/* Verification Card */}
        <div className="glass-panel p-8 sm:p-10 border border-slate-800 shadow-2xl relative rounded-2xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Cryptographic Authenticity Check
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight sm:text-3xl">
              Verify a Certificate
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              Enter the unique Certificate ID issued by SkillCert 360 to verify student completion, skill mastery, and issuer authenticity.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="certId" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Certificate ID / Verification Number
              </label>
              <div className="relative">
                <input
                  id="certId"
                  type="text"
                  value={certId}
                  onChange={(e) => {
                    setCertId(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. CERT-2026-89412 or 620125243146-C1"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3.5 pl-11 text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
              {error && <p className="text-xs text-rose-400 font-medium mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              <span>Verify Certificate</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>Instant Verification Guarantee</span>
            </div>
            <p className="leading-relaxed">
              SkillCert 360 certificates are digitally signed and verifiable against our authoritative academic ledger.
            </p>
          </div>
        </div>

        {/* Back navigation */}
        <div className="text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-cyan-300 transition-colors">
            ← Back to SkillCert 360 Home
          </Link>
        </div>
      </div>
    </main>
  );
}
