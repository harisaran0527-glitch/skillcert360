"use client";

import React, { useState } from "react";
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
  const { pending: formPending } = useFormStatus();
  const [submitted, setSubmitted] = useState(false);

  const isPending = formPending || submitted || disabled;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setSubmitted(true);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      {...props}
      type="submit"
      onClick={handleClick}
      disabled={isPending}
      className={`${className} transition-all active:scale-[0.98] ${
        isPending ? "opacity-80 cursor-wait pointer-events-none" : ""
      }`}
    >
      {formPending || submitted ? (
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
