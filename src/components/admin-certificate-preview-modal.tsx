"use client";

import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  ExternalLink,
  X,
  Eye,
  Paperclip,
} from "lucide-react";

interface AdminCertificatePreviewModalProps {
  certificateId: string;
  originalFileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
}

export function AdminCertificatePreviewModal({
  certificateId,
  originalFileName,
  mimeType,
  fileSize,
}: AdminCertificatePreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  function formatBytes(bytes: number | null): string {
    if (!bytes) return "File";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  const isPdf = mimeType?.includes("pdf") || originalFileName?.toLowerCase().endsWith(".pdf");
  const isImage = mimeType?.startsWith("image/") || /\.(jpg|jpeg|png)$/i.test(originalFileName || "");

  const fileUrl = `/api/certificates/${certificateId}/file`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
      >
        <Paperclip className="h-4 w-4 text-cyan-400" />
        <span>
          View File ({originalFileName || "Certificate"} • {formatBytes(fileSize)})
        </span>
        <Eye className="h-3.5 w-3.5 ml-1 text-cyan-400" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-4xl rounded-3xl p-6 border border-cyan-500/30 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display truncate max-w-md">
                    {originalFileName || "Certificate Document"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {mimeType || "application/octet-stream"} • {formatBytes(fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  <span>Open Full Window</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-2 min-h-[400px] flex items-center justify-center">
              {isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-[550px] rounded-xl border-0"
                  title="PDF Certificate Preview"
                />
              ) : isImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={fileUrl}
                  alt="Certificate Image Preview"
                  className="max-w-full max-h-[550px] object-contain mx-auto rounded-xl"
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-3">
                  <FileText className="h-10 w-10 text-slate-500 mx-auto" />
                  <p className="font-semibold text-white">Preview unavailable for this format.</p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 underline font-semibold"
                  >
                    <span>Download file directly</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
