"use client";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

export function LearnOfficialButton({
  skillId,
  courseId,
  officialUrl,
  label = "Learn Officially",
}: {
  skillId: string;
  courseId?: string;
  officialUrl?: string | null;
  label?: string;
}) {
  const router = useRouter();
  const handleClick = async () => {
    if (!officialUrl) {
      alert("This skill has no verified official course URL yet.");
      return;
    }

    const res = await fetch("/api/student/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId, courseId, action: "learn" }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ error: "Unable to record learning start." }));
      alert(payload.error || "Unable to record learning start.");
      return;
    }

    window.open(officialUrl, "_blank", "noopener,noreferrer");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!officialUrl}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
    >
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5" />
    </button>
  );
}
