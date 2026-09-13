"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordField({ name = "password", variant = "dark", placeholder = "••••••••••••" }: { name?: string; variant?: "dark" | "light"; placeholder?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  const inputClassName =
    variant === "dark"
      ? "w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
      : "w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition";

  const buttonClassName =
    variant === "dark"
      ? "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition"
      : "absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition";

  return (
    <div className="relative mt-1.5">
      <input
        name={name}
        type={showPassword ? "text" : "password"}
        required
        placeholder={placeholder}
        className={inputClassName}
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        onClick={() => setShowPassword((value) => !value)}
        className={buttonClassName}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
