"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordField({ name = "password", variant = "dark" }: { name?: string; variant?: "dark" | "light" }) {
  const [showPassword, setShowPassword] = useState(false);

  const inputClassName =
    variant === "dark"
      ? "mt-2 w-full rounded-lg border border-white/10 bg-[#0c2140] px-4 py-3 pr-12 text-white outline-none focus:border-[#35c3d9]"
      : "mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-[#1e6fd9]";

  const buttonClassName =
    variant === "dark"
      ? "absolute inset-y-0 right-3 flex items-center text-blue-100/70 hover:text-white"
      : "absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700";

  return (
    <div className="relative">
      <input
        name={name}
        type={showPassword ? "text" : "password"}
        required
        className={inputClassName}
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        onClick={() => setShowPassword((value) => !value)}
        className={buttonClassName}
      >
        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
