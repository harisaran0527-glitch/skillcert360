"use client";
import { useRouter } from "next/navigation";

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
      className="rounded-lg border border-[#1e6fd9] bg-[#1e6fd9] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200"
    >
      {label}
    </button>
  );
}
