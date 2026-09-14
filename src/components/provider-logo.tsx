"use client";

import React from "react";

interface ProviderLogoProps {
  name: string;
  slug?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProviderLogo({ name, slug, className = "", size = "md" }: ProviderLogoProps) {
  const normSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]/g, "");

  const dimensions = {
    sm: "w-5 h-5 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  }[size];

  // Colors and SVG icons per provider
  switch (true) {
    case normSlug.includes("microsoft"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#00a4ef]/10 border border-[#00a4ef]/30 p-1.5 ${dimensions} ${className}`} title="Microsoft">
          <svg viewBox="0 0 23 23" className="w-full h-full">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
        </div>
      );

    case normSlug.includes("aws") || normSlug.includes("amazon"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#ff9900]/10 border border-[#ff9900]/30 p-1.5 ${dimensions} ${className}`} title="Amazon Web Services">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="#ff9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14.5c2.5 2 6 3 9.5 3s6.5-1 8.5-3" />
            <path d="M19 14.5l2.5.5v2.5" />
            <text x="3" y="11" fill="#ffffff" stroke="none" fontSize="8" fontWeight="bold" fontFamily="sans-serif">AWS</text>
          </svg>
        </div>
      );

    case normSlug.includes("google"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#4285f4]/10 border border-[#4285f4]/30 p-1.5 ${dimensions} ${className}`} title="Google Cloud">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </div>
      );

    case normSlug.includes("cisco"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#049fd9]/10 border border-[#049fd9]/30 p-1.5 ${dimensions} ${className}`} title="Cisco">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="#049fd9">
            <path d="M4 14h2v5H4zm4-4h2v9H8zm4-4h2v13h-2zm4 4h2v9h-2zm4 4h2v5h-2z" />
          </svg>
        </div>
      );

    case normSlug.includes("ibm"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#1261fe]/10 border border-[#1261fe]/30 p-1.5 ${dimensions} ${className}`} title="IBM">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="#1261fe">
            <text x="2" y="16" fill="#1261fe" fontSize="11" fontWeight="900" fontFamily="monospace" letterSpacing="1">IBM</text>
          </svg>
        </div>
      );

    case normSlug.includes("github"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 p-1.5 ${dimensions} ${className}`} title="GitHub">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="#ffffff">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
      );

    case normSlug.includes("nvidia"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#76b900]/10 border border-[#76b900]/30 p-1.5 ${dimensions} ${className}`} title="NVIDIA">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="#76b900">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
          </svg>
        </div>
      );

    case normSlug.includes("redhat"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#ee0000]/10 border border-[#ee0000]/30 p-1.5 ${dimensions} ${className}`} title="Red Hat">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="#ee0000">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 15h-2v-2h2v2zm3-4H9V9h5v4z" />
          </svg>
        </div>
      );

    case normSlug.includes("oracle"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#f80000]/10 border border-[#f80000]/30 p-1.5 ${dimensions} ${className}`} title="Oracle">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <rect x="2" y="6" width="20" height="12" rx="6" fill="none" stroke="#f80000" strokeWidth="3" />
          </svg>
        </div>
      );

    case normSlug.includes("mongodb"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#13aa52]/10 border border-[#13aa52]/30 p-1.5 ${dimensions} ${className}`} title="MongoDB">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="#13aa52">
            <path d="M12 2C11.5 4 10 8 10 12c0 3.3 1.8 6.2 2 8 .2-1.8 2-4.7 2-8 0-4-1.5-8-2-10z" />
          </svg>
        </div>
      );

    case normSlug.includes("salesforce"):
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#00a1e0]/10 border border-[#00a1e0]/30 p-1.5 ${dimensions} ${className}`} title="Salesforce">
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="#00a1e0">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        </div>
      );

    default: {
      const initials = name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

      return (
        <div
          className={`flex items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 text-cyan-300 font-bold font-display ${dimensions} ${className}`}
          title={name}
        >
          {initials || "PROV"}
        </div>
      );
    }
  }
}
