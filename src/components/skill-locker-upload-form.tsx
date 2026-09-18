"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface SkillOption {
  id: string;
  name: string;
}

interface CourseOption {
  id: string;
  name: string;
  title: string | null;
  skillId: string;
  provider: {
    name: string;
  };
}

interface SkillLockerUploadFormProps {
  skills: SkillOption[];
  courses: CourseOption[];
  preselectedSkillId?: string;
  preselectedCourseId?: string;
}

export function SkillLockerUploadForm({
  skills,
  courses,
  preselectedSkillId,
  preselectedCourseId,
}: SkillLockerUploadFormProps) {
  const router = useRouter();
  const [selectedSkillId, setSelectedSkillId] = useState(preselectedSkillId || (skills[0]?.id ?? ""));
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const filteredCourses = courses.filter((c) => c.skillId === selectedSkillId);

  const handleSkillChange = (skillId: string) => {
    setSelectedSkillId(skillId);
    const available = courses.filter((c) => c.skillId === skillId);
    setSelectedCourseId(available[0]?.id || "");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10 MB limit.");
        setFileName("");
        e.target.value = "";
        return;
      }
      setError(null);
      setFileName(file.name);
    } else {
      setFileName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/student/certificates/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload certificate");
      }

      setSuccess("Certificate uploaded successfully! It is now pending admin verification.");
      setFileName("");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-cyan-500/20">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white font-display">Upload Original Certificate</h2>
          <p className="text-xs text-slate-400">
            Submit your official provider certificate (PDF, JPG, JPEG, PNG · Max 10 MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-3 text-xs font-semibold text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Skill Select */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Skill *</label>
            <select
              name="skillId"
              value={selectedSkillId}
              onChange={(e) => handleSkillChange(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course Select */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Official Course *</label>
            <select
              name="courseId"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Select course...</option>
              {filteredCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.name} ({c.provider.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Certificate Title *</label>
          <input
            type="text"
            name="certificateTitle"
            required
            placeholder="e.g. AWS Certified Solutions Architect Associate"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Credential ID */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Credential ID (Optional)</label>
            <input
              type="text"
              name="credentialId"
              placeholder="e.g. AWS-12345678"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Credential URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Credential URL (Optional)</label>
            <input
              type="url"
              name="credentialUrl"
              placeholder="https://credly.com/badges/..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Issue Date */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Issue Date *</label>
            <input
              type="date"
              name="issueDate"
              required
              max={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Expiry Date (Optional)</label>
            <input
              type="date"
              name="expiryDate"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Original Certificate File *</label>
          <div className="relative rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 p-4 text-center hover:border-cyan-500/50 transition-colors">
            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-1">
              <FileText className="h-6 w-6 text-cyan-400" />
              <span className="font-semibold text-slate-200">
                {fileName ? fileName : "Click to select or drag and drop certificate file"}
              </span>
              <span className="text-[11px] text-slate-400">PDF, JPG, JPEG, PNG (Max 10 MB)</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading to SkillLocker...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Upload Certificate to SkillLocker
            </>
          )}
        </button>
      </form>
    </div>
  );
}
