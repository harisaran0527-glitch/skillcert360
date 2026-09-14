"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface DeleteStudentModalProps {
  studentId: string;
  studentName: string;
  registerNumber: string;
}

export function DeleteStudentModal({
  studentId,
  studentName,
  registerNumber,
}: DeleteStudentModalProps) {
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isConfirmed =
    confirmValue.trim().toUpperCase() === "DELETE" ||
    confirmValue.trim().toUpperCase() === registerNumber.toUpperCase();

  function handleOpen() {
    setOpen(true);
    setConfirmValue("");
    setError(null);
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setConfirmValue("");
    setError(null);
  }

  function handleDelete() {
    if (!isConfirmed || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/students/${studentId}/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: confirmValue.trim() }),
        });

        if (res.ok) {
          setOpen(false);
          router.push("/admin/students?deleted=1");
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(
            (data as { error?: string }).error ??
              "Deletion failed. Please try again."
          );
        }
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-rose-600 hover:to-rose-500 transition-all cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete Student
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-[#0d1117] shadow-2xl shadow-rose-900/30 p-6 space-y-5"
            role="dialog"
            aria-modal="true"
            aria-label="Delete student confirmation"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    Delete Student Account
                  </h2>
                  <p className="text-[11px] text-rose-400 font-semibold">
                    This action is permanent and irreversible.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Warning Body */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs space-y-2">
              <p className="font-bold text-rose-300">
                You are about to permanently delete:
              </p>
              <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                <p>
                  <strong className="text-white">Name:</strong>{" "}
                  {studentName}
                </p>
                <p>
                  <strong className="text-white">Register No:</strong>{" "}
                  {registerNumber}
                </p>
              </div>
              <p className="text-rose-200/80 mt-2 leading-relaxed">
                All skills, assessments, certificates, activity logs, and the
                user account will be <strong>permanently erased</strong>. Any
                uploaded certificate files will be deleted from storage. This
                cannot be undone.
              </p>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Type{" "}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-rose-300">
                  DELETE
                </code>{" "}
                or the register number{" "}
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">
                  {registerNumber}
                </code>{" "}
                to confirm:
              </label>
              <input
                type="text"
                value={confirmValue}
                onChange={(e) => {
                  setConfirmValue(e.target.value);
                  setError(null);
                }}
                disabled={isPending}
                placeholder="Type DELETE or register number"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none font-mono disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isConfirmed || isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-rose-600 hover:to-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
