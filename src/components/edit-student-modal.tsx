"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, X, Loader2, Save, UserCheck } from "lucide-react";

export interface StudentEditData {
  id: string;
  fullName: string;
  registerNumber: string;
  email: string;
  departmentId: string;
  sectionName: string;
  year: number;
  status: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

interface EditStudentModalProps {
  student: StudentEditData;
  departments: DepartmentOption[];
}

export function EditStudentModal({ student, departments }: EditStudentModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [fullName, setFullName] = useState(student.fullName);
  const [registerNumber, setRegisterNumber] = useState(student.registerNumber);
  const [email, setEmail] = useState(student.email);
  const [departmentId, setDepartmentId] = useState(student.departmentId);
  const [sectionName, setSectionName] = useState(student.sectionName);
  const [year, setYear] = useState(student.year);
  const [status, setStatus] = useState(student.status);

  function handleOpen() {
    setFullName(student.fullName);
    setRegisterNumber(student.registerNumber);
    setEmail(student.email);
    setDepartmentId(student.departmentId);
    setSectionName(student.sectionName);
    setYear(student.year);
    setStatus(student.status);
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("_action", "edit");
    formData.append("fullName", fullName.trim());
    formData.append("registerNumber", registerNumber.trim());
    formData.append("email", email.trim());
    formData.append("departmentId", departmentId);
    formData.append("sectionName", sectionName);
    formData.append("year", String(year));
    formData.append("status", status);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/students/${student.id}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        });

        if (res.ok) {
          setOpen(false);
          router.push("/admin/students?edited=1");
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Failed to update student profile.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <>
      {/* Action Button Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-xs hover:bg-indigo-500/25 transition-all cursor-pointer"
      >
        <Edit className="h-3 w-3" />
        <span>Edit</span>
      </button>

      {/* Modal Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-indigo-500/40 bg-[#0d1117] shadow-2xl shadow-indigo-950/50 p-6 space-y-5"
            role="dialog"
            aria-modal="true"
            aria-label="Edit student profile"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display">Edit Student Profile</h2>
                  <p className="text-[11px] text-slate-400">Update academic details and account standing.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Row 1: Full Name & Register Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Register Number</label>
                  <input
                    type="text"
                    required
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Row 2: Department & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Section</label>
                  <select
                    name="sectionName"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Academic Year & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Academic Year</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    disabled={isPending}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-semibold">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-indigo-400 hover:to-purple-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
