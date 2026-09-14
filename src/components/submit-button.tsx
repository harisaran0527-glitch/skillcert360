"use client";

import React, { useState, useEffect } from "react";
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
  const [clicked, setClicked] = useState(false);

  // Automatically reset click state whenever form is no longer pending
  useEffect(() => {
    if (!pending) {
      setClicked(false);
    }
  }, [pending]);

  const isPending = pending || clicked || disabled;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setClicked(true);
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
        isPending ? "opacity-80 cursor-wait" : ""
      }`}
    >
      {isPending ? (
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
