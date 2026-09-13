"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  Sparkles,
} from "lucide-react";

type Exam = {
  questions: { id: string; prompt: string; type: string; options: string[] }[];
  responses: Record<string, string | string[]>;
  serverNow: string;
  expiresAt: string;
  violationCount: number;
  violationLimit: number;
  attemptNumber: number;
  redirect?: string;
  skillName?: string;
  levelName?: string;
  passMark?: number;
  durationMinutes?: number;
};

export function StudentAssessmentClient({
  attemptId,
  studentName,
  registerNumber,
  studentEmail = "",
  departmentName = "",
  yearSection = "",
}: {
  attemptId: string;
  studentName: string;
  registerNumber: string;
  studentEmail?: string;
  departmentName?: string;
  yearSection?: string;
}) {
  const [exam, setExam] = useState<Exam>();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [full, setFull] = useState(false);
  const [message, setMessage] = useState("Fullscreen is required. The server timer continues while this page is closed.");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const client = useRef("");
  const active = useRef(false);
  const closing = useRef(false);
  const clock = useRef({ remaining: 0, at: 0 });
  const values = useRef<Record<string, string | string[]>>({});
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const send = useCallback(
    (action: string, extra: object = {}) => {
      const next = queue.current.catch(() => undefined).then(async () => {
        const res = await fetch(`/api/student/assessment/${attemptId}/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: client.current, ...extra }),
          keepalive: action === "violation",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        if (data.redirect) {
          closing.current = true;
          active.current = false;
          window.location.assign(data.redirect);
        } else {
          clock.current = {
            remaining: Date.parse(data.expiresAt) - Date.parse(data.serverNow),
            at: performance.now(),
          };
          setExam(data);
        }
        return data as Exam;
      });
      queue.current = next;
      return next;
    },
    [attemptId]
  );

  useEffect(() => {
    const key = `skillcert_tab_${attemptId}`;
    const tabId = sessionStorage.getItem(key) || crypto.randomUUID();
    sessionStorage.setItem(key, tabId);
    client.current = "";
    let release: (() => void) | undefined;
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const acquire = (remaining: number) => {
      void navigator.locks.request(key, { ifAvailable: true }, async (lock) => {
        if (disposed) return;
        if (!lock) {
          if (remaining) retry = setTimeout(() => acquire(remaining - 1), 100);
          else setMessage("Assessment already open in another tab. Close this tab.");
          return;
        }
        client.current = tabId;
        setReady(true);
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      });
    };

    if (navigator.locks) acquire(2);
    else {
      client.current = tabId;
      queueMicrotask(() => {
        if (!disposed) setReady(true);
      });
    }

    return () => {
      disposed = true;
      active.current = false;
      clearTimeout(retry);
      release?.();
    };
  }, [attemptId]);

  useEffect(() => {
    const violation = (types: string[]) => {
      if (active.current && !closing.current)
        void send("violation", { types })
          .then((d) => setMessage(`Security Alert: Violation Recorded (${d.violationCount}/${d.violationLimit})`))
          .catch((e) => setMessage(e.message));
    };

    const visibility = () => {
      if (document.hidden) violation(["TAB_SWITCH", "PAGE_HIDDEN"]);
    };
    const blur = () => violation(["WINDOW_BLUR"]);
    const fullscreen = () => {
      setFull(!!document.fullscreenElement);
      if (!document.fullscreenElement) violation(["FULLSCREEN_EXIT"]);
    };

    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    document.addEventListener("fullscreenchange", fullscreen);

    const heartbeat = setInterval(() => {
      if (active.current && !closing.current)
        void send("heartbeat").catch((e) => setMessage(e.message));
    }, 5000);

    const timer = setInterval(() => {
      if (!active.current || closing.current) return;
      const left = Math.max(0, Math.ceil((clock.current.remaining - performance.now() + clock.current.at) / 1000));
      setSeconds(left);
      if (!left) {
        closing.current = true;
        void send("heartbeat")
          .then((d) => {
            if (!d.redirect) closing.current = false;
          })
          .catch((e) => {
            closing.current = false;
            setMessage(e.message);
          });
      }
    }, 250);

    return () => {
      clearInterval(heartbeat);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      document.removeEventListener("fullscreenchange", fullscreen);
    };
  }, [send]);

  async function enter() {
    if (!client.current) return;
    setBusy(true);
    try {
      await document.documentElement.requestFullscreen();
      const data = await send("claim");
      if (data.redirect) return;
      values.current = data.responses;
      setAnswers(data.responses);
      active.current = true;
      setFull(true);
      setMessage("Answers save automatically. Stay in fullscreen.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Fullscreen required");
    } finally {
      setBusy(false);
    }
  }

  function change(id: string, value: string | string[]) {
    if (!full || closing.current) return;
    values.current = { ...values.current, [id]: value };
    setAnswers({ ...values.current });
    void send("save", { responses: { [id]: value } })
      .then(() => setMessage("Answer saved automatically."))
      .catch((e) => setMessage("Save failed: " + e.message));
  }

  function toggleReview(id: string) {
    setMarkedForReview((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function submit() {
    if (closing.current) return;
    closing.current = true;
    setBusy(true);
    try {
      await send("submit", { responses: values.current });
    } catch (e) {
      closing.current = false;
      setBusy(false);
      setMessage(e instanceof Error ? e.message : "Retry submission");
    }
  }

  const q = exam?.questions[index];
  const totalQuestions = exam?.questions.length || 0;
  const answeredCount = Object.keys(answers).filter((key) => {
    const val = answers[key];
    return Array.isArray(val) ? val.length > 0 : Boolean(val);
  }).length;

  const watermarkText = `${studentName} • ${registerNumber} • ${attemptId.slice(0, 8)}`;

  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 font-sans select-none overflow-x-hidden">
      {/* Background Watermark Pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 flex flex-wrap items-center justify-around opacity-[0.03] rotate-[-15deg] scale-125 font-mono text-[11px] uppercase tracking-widest text-slate-100">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className="p-6">{watermarkText}</span>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* PRE-EXAM CONFIRMATION SCREEN */}
        {!full || !exam ? (
          <div className="mx-auto max-w-3xl space-y-6 pt-6">
            <div className="glass-panel rounded-3xl p-8 space-y-6 border border-cyan-500/30 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                  <ShieldAlert className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">SkillCert 360 Proctored Platform</span>
                  <h1 className="text-2xl font-extrabold text-white font-display">Secure Assessment Entry Confirmation</h1>
                </div>
              </div>

              {/* Message Alert */}
              {message && (
                <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              {/* Student Metadata Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Student Profile Credentials</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Name:</span>
                    <span className="font-bold text-white truncate block">{studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Register Number:</span>
                    <span className="font-mono font-bold text-white block">{registerNumber}</span>
                  </div>
                  {studentEmail && (
                    <div>
                      <span className="text-slate-500 block">Email:</span>
                      <span className="font-semibold text-slate-300 truncate block">{studentEmail}</span>
                    </div>
                  )}
                  {departmentName && (
                    <div>
                      <span className="text-slate-500 block">Department:</span>
                      <span className="font-semibold text-slate-300 block">{departmentName}</span>
                    </div>
                  )}
                  {yearSection && (
                    <div>
                      <span className="text-slate-500 block">Year / Section:</span>
                      <span className="font-semibold text-slate-300 block">{yearSection}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Strict Security Rules Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Mandatory Assessment Security Rules
                </h2>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Fullscreen Mode Mandatory:</strong> Exiting fullscreen or minimizing will record an official security violation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Proctored Environment:</strong> Tab switching, window blurring, or opening other apps will be logged immediately.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Copy / Paste Restricted:</strong> Context menus and clipboard actions are disabled during evaluation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span><strong>Non-Resettable Countdown:</strong> The server timer runs continuously. Closing the window does not pause the clock.</span>
                  </li>
                </ul>
              </div>

              {/* Start CTA */}
              <div className="pt-2">
                <button
                  disabled={busy || !ready}
                  onClick={enter}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-4 text-sm font-extrabold text-white shadow-xl shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <ShieldAlert className="h-5 w-5" />
                  <span>{busy ? "Initializing Secure Session..." : "Enter Secure Assessment Environment"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE DISTRACTION-FREE EXAM LAYOUT */
          <div className="space-y-6">
            {/* Exam Top Header */}
            <header className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-cyan-500/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                    Attempt #{exam.attemptNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {exam.skillName || "Skill Assessment"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {studentName} · <span className="font-mono text-cyan-400">{registerNumber}</span>
                </p>
              </div>

              {/* Right Stats: Timer & Violation Pill */}
              <div className="flex items-center gap-4">
                {/* Violation Pill */}
                <div
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                    exam.violationCount > 0
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                      : "border-slate-800 bg-slate-900/80 text-slate-400"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Violations: {exam.violationCount} / {exam.violationLimit}</span>
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-cyan-300 font-mono shadow-inner">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <span role="timer" className="text-xl font-extrabold font-mono text-white">
                    {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </header>

            {/* Status Alert Bar */}
            {message && (
              <div role="status" className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-3.5 text-xs font-semibold text-cyan-300 flex items-center justify-between">
                <span>{message}</span>
                <span className="text-[10px] text-slate-400">Auto-Saving Enabled</span>
              </div>
            )}

            {/* Main Question & Navigation Grid */}
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Left Column: Question Area */}
              <main className="lg:col-span-3 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                {q && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                        Question {index + 1} of {totalQuestions}
                      </span>
                      <button
                        onClick={() => toggleReview(q.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          markedForReview[q.id]
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                        }`}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>{markedForReview[q.id] ? "Marked for Review" : "Mark for Review"}</span>
                      </button>
                    </div>

                    {/* Question Prompt */}
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed font-display">
                      {q.prompt}
                    </h2>

                    {/* Options / Input */}
                    <div className="space-y-3 pt-2">
                      {["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.type) ? (
                        q.options.map((option) => {
                          const isChecked = Array.isArray(answers[q.id])
                            ? (answers[q.id] as string[]).includes(option)
                            : answers[q.id] === option;

                          return (
                            <label
                              key={option}
                              className={`flex items-center gap-3.5 rounded-2xl border p-4 text-xs font-semibold cursor-pointer transition-all duration-150 ${
                                isChecked
                                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200 shadow-md shadow-cyan-500/5"
                                  : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/90"
                              }`}
                            >
                              <input
                                type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                                name={q.id}
                                checked={isChecked}
                                onChange={() => {
                                  const a = answers[q.id];
                                  const list = Array.isArray(a) ? a : [];
                                  change(
                                    q.id,
                                    q.type === "MULTIPLE_CHOICE"
                                      ? list.includes(option)
                                        ? list.filter((v) => v !== option)
                                        : [...list, option]
                                      : option
                                  );
                                }}
                                className="h-4 w-4 accent-cyan-400"
                              />
                              <span className="flex-1">{option}</span>
                            </label>
                          );
                        })
                      ) : (
                        <input
                          aria-label="Answer input"
                          placeholder="Type your answer here..."
                          className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                          value={String(answers[q.id] ?? "")}
                          onChange={(e) => change(q.id, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Control Bar */}
                <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    disabled={index === 0}
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {index < totalQuestions - 1 && (
                      <button
                        onClick={() => setIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all"
                      >
                        <span>Save & Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      disabled={busy}
                      onClick={() => setShowSubmitConfirm(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Assessment</span>
                    </button>
                  </div>
                </div>
              </main>

              {/* Right Column: Question Navigation Palette */}
              <aside className="glass-panel rounded-3xl p-5 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-white font-display">Question Palette</span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {answeredCount}/{totalQuestions} Answered
                    </span>
                  </div>

                  {/* Palette Indicators Legend */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span>Marked Review</span>
                    </div>
                  </div>

                  {/* Grid Palette Buttons */}
                  <div className="grid grid-cols-5 gap-2 pt-2">
                    {exam.questions.map((item, i) => {
                      const hasAnswer = Array.isArray(answers[item.id])
                        ? (answers[item.id] as string[]).length > 0
                        : Boolean(answers[item.id]);
                      const isReview = markedForReview[item.id];
                      const isCurrent = i === index;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setIndex(i)}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 ${
                            isCurrent
                              ? "border-2 border-cyan-400 bg-cyan-500/20 text-white shadow-md shadow-cyan-500/20"
                              : isReview
                              ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                              : hasAnswer
                              ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                              : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <p>Attempt ID: <span className="font-mono text-slate-400">{attemptId.slice(0, 8)}</span></p>
                  <p>Status: Monitoring Active</p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 space-y-5 border border-cyan-500/30 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Submit Assessment?</h3>
                <p className="text-xs text-slate-400">Confirm final submission of your responses.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Questions:</span>
                <span className="font-bold text-white font-mono">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Answered Questions:</span>
                <span className="font-bold text-cyan-400 font-mono">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Unanswered:</span>
                <span className="font-bold text-amber-400 font-mono">{totalQuestions - answeredCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel & Review
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setShowSubmitConfirm(false);
                  submit();
                }}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
