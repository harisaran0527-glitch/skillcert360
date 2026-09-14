"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function SubmitButton({
  pendingText = "Processing...",
  children,
  className = "",
  disabled,
  icon,
  onClick,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const isPending = pending || disabled;

  return (
    <button
      {...props}
      type="submit"
      onClick={onClick}
      disabled={isPending}
      className={`${className} transition-all active:scale-[0.98] ${
        pending ? "opacity-80 cursor-wait" : ""
      }`}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-2" />
          <span>{pendingText}</span>
        </>
      ) : (
        <>
          {children}
          {icon}
        </>
      )}
    </button>
  );
}
