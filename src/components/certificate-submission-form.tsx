"use client";

import { useState, useRef, ChangeEvent, DragEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Info,
} from "lucide-react";

interface EligibleSkillCert {
  id: string;
  skillId: string;
  skill: {
    name: string;
    level: {
      name: string;
    };
  };
}

interface CertificateSubmissionFormProps {
  eligible: EligibleSkillCert[];
  storageConfigured: boolean;
}

export function CertificateSubmissionForm({
  eligible,
  storageConfigured,
}: CertificateSubmissionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSkillId, setSelectedSkillId] = useState(eligible[0]?.skillId || "");
  const [officialUrl, setOfficialUrl] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "selecting" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

  function validateFile(file: File): string | null {
    if (file.size > maxSizeBytes) {
      return "File too large. Maximum allowed size is 5 MB.";
    }

    const name = file.name.toLowerCase();
    const isExtValid = allowedExtensions.some((ext) => name.endsWith(ext));
    const isTypeValid = allowedTypes.includes(file.type);

    if (!isExtValid && !isTypeValid) {
      return "Unsupported file format. Only PDF, JPG, JPEG, and PNG files are allowed.";
    }

    return null;
  }

  function handleFileSelect(file: File) {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setStatus("error");
      setSelectedFile(null);
      return;
    }

    if (!storageConfigured) {
      setErrorMessage(
        "External file storage is not configured on this server. Please submit via Credential URL and Credential ID."
      );
      setStatus("error");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setStatus("selecting");
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setStatus("idle");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSkillId) {
      setErrorMessage("Select a passed skill.");
      setStatus("error");
      return;
    }

    if (!issuedAt) {
      setErrorMessage("Select the official issue date.");
      setStatus("error");
      return;
    }

    const hasUrl = !!officialUrl.trim();
    const hasId = !!credentialId.trim();
    const hasFile = !!selectedFile;

    const hasSufficientEvidence = (hasUrl && hasId) || (hasFile && hasId) || (hasFile && hasUrl);
    if (!hasSufficientEvidence) {
      setErrorMessage(
        "Provide sufficient credential evidence (Credential ID + URL, File + ID, or File + URL)."
      );
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("skillId", selectedSkillId);
      if (officialUrl.trim()) formData.append("officialUrl", officialUrl.trim());
      if (credentialId.trim()) formData.append("credentialId", credentialId.trim());
      formData.append("issuedAt", issuedAt);
      if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch("/api/student/certificates", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errText = "Upload failed";
        try {
          const json = await res.json();
          errText = json.error || errText;
        } catch {
          errText = `Upload request failed with status ${res.status}`;
        }
        throw new Error(errText);
      }

      setStatus("success");
      clearFile();
      setOfficialUrl("");
      setCredentialId("");
      setIssuedAt("");
      router.push("?success=1");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">Submit Official Credential</h2>
            <p className="text-xs text-slate-400">
              Submit certificate file, URL or Credential ID for verification.
            </p>
          </div>
        </div>

        {!storageConfigured && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
            <Info className="h-3 w-3" /> URL / ID Active
          </span>
        )}
      </div>

      {/* Alert Banner for Status / Error Messages */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === "success" && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2.5"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="font-semibold">Certificate submitted for verification</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Passed Skill Selection */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Select Passed Skill</label>
          <select
            name="skillId"
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            disabled={!eligible.length || status === "uploading"}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          >
            {eligible.map((cert) => (
              <option key={cert.id} value={cert.skillId}>
                {cert.skill.name} ({cert.skill.level.name})
              </option>
            ))}
            {!eligible.length && (
              <option value="">No eligible skills available for submission</option>
            )}
          </select>
        </div>

        {/* Certificate File Upload Area */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">
            Certificate File <span className="text-slate-500 font-normal">(Optional if URL + ID provided)</span>
          </label>

          {!selectedFile ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={onFileChange}
                disabled={status === "uploading"}
                className="hidden"
              />
              <div className="flex flex-col items-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">
                    Drag & Drop certificate or <span className="text-cyan-400 underline">Browse File</span>
                  </p>
                  <p className="text-[11px] text-slate-400">PDF, JPG or PNG • Maximum 5 MB</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 truncate">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                  {selectedFile.type.includes("pdf") ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="truncate text-xs">
                  <p className="font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedFile.type || "File"} • {formatBytes(selectedFile.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearFile}
                disabled={status === "uploading"}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Credential Details Inputs */}
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Credential ID / Number</label>
            <input
              name="credentialId"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="e.g. CERT-2026-98765"
              disabled={status === "uploading"}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Official Credential URL</label>
            <input
              name="officialUrl"
              type="url"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
              placeholder="https://coursera.org/verify/EXAMPLE123"
              disabled={status === "uploading"}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Official Issue Date</label>
            <input
              name="issuedAt"
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              required
              disabled={status === "uploading"}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!eligible.length || status === "uploading"}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-40 cursor-pointer"
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Uploading & Submitting Certificate...</span>
            </>
          ) : (
            <>
              <FileCheck2 className="h-4 w-4" />
              <span>Submit Certificate for Verification</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
