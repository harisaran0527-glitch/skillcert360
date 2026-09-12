"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type Exam = { questions: { id: string; prompt: string; type: string; options: string[] }[]; responses: Record<string, string | string[]>; serverNow: string; expiresAt: string; violationCount: number; violationLimit: number; attemptNumber: number; redirect?: string };
export function StudentAssessmentClient({ attemptId, studentName, registerNumber }: { attemptId: string; studentName: string; registerNumber: string }) {
 const [exam, setExam] = useState<Exam>();
 const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
 const [index, setIndex] = useState(0);
 const [seconds, setSeconds] = useState(0);
 const [full, setFull] = useState(false);
 const [message, setMessage] = useState("Fullscreen is required. The server timer continues while this page is closed.");
 const [busy, setBusy] = useState(false);
 const [ready, setReady] = useState(false);
 const client = useRef("");
 const active = useRef(false);
 const closing = useRef(false);
 const clock = useRef({ remaining: 0, at: 0 });
 const values = useRef<Record<string, string | string[]>>({});
 const queue = useRef<Promise<unknown>>(Promise.resolve());
 const send = useCallback((action: string, extra: object = {}) => {
  const next = queue.current.catch(() => undefined).then(async () => {
   const res = await fetch(`/api/student/assessment/${attemptId}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: client.current, ...extra }), keepalive: action === "violation" });
   const data = await res.json();
   if (!res.ok) throw new Error(data.error || "Request failed");
   if (data.redirect) { closing.current = true; active.current = false; window.location.assign(data.redirect); }
   else { clock.current = { remaining: Date.parse(data.expiresAt) - Date.parse(data.serverNow), at: performance.now() }; setExam(data); }
   return data as Exam;
  });
  queue.current = next; return next;
 }, [attemptId]);
 useEffect(() => {
  const key = `skillcert_tab_${attemptId}`;
  const tabId = sessionStorage.getItem(key) || crypto.randomUUID();
  sessionStorage.setItem(key, tabId);
  client.current = "";
  let release: (() => void) | undefined;
  let disposed = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  const acquire = (remaining: number) => {
   void navigator.locks.request(key, { ifAvailable: true }, async lock => {
    if (disposed) return;
    if (!lock) {
     if (remaining) retry = setTimeout(() => acquire(remaining - 1), 100);
     else setMessage("Assessment already open in another tab. Close this tab.");
     return;
    }
    client.current = tabId;
    setReady(true);
    await new Promise<void>(resolve => { release = resolve; });
   });
  };
  if (navigator.locks) acquire(2); else { client.current = tabId; queueMicrotask(() => { if (!disposed) setReady(true); }); }
  return () => { disposed = true; active.current = false; clearTimeout(retry); release?.(); };
 }, [attemptId]);
 useEffect(() => {
  const violation = (types: string[]) => {
   if (active.current && !closing.current) void send("violation", { types }).then(d => setMessage(`Violations: ${d.violationCount}/${d.violationLimit}`)).catch(e => setMessage(e.message));
  };
  const visibility = () => { if (document.hidden) violation(["TAB_SWITCH", "PAGE_HIDDEN"]); };
  const blur = () => violation(["WINDOW_BLUR"]);
  const fullscreen = () => { setFull(!!document.fullscreenElement); if (!document.fullscreenElement) violation(["FULLSCREEN_EXIT"]); };
  document.addEventListener("visibilitychange", visibility); window.addEventListener("blur", blur); document.addEventListener("fullscreenchange", fullscreen);
  const heartbeat = setInterval(() => { if (active.current && !closing.current) void send("heartbeat").catch(e => setMessage(e.message)); }, 5000);
  const timer = setInterval(() => {
   if (!active.current || closing.current) return;
   const left = Math.max(0, Math.ceil((clock.current.remaining - performance.now() + clock.current.at) / 1000)); setSeconds(left);
   if (!left) { closing.current = true; void send("heartbeat").then(d => { if (!d.redirect) closing.current = false; }).catch(e => { closing.current = false; setMessage(e.message); }); }
  }, 250);
  return () => { clearInterval(heartbeat); clearInterval(timer); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", blur); document.removeEventListener("fullscreenchange", fullscreen); };
 }, [send]);
 async function enter() {
  if (!client.current) return;
  setBusy(true);
  try { await document.documentElement.requestFullscreen(); const data = await send("claim"); if (data.redirect) return; values.current = data.responses; setAnswers(data.responses); active.current = true; setFull(true); setMessage("Answers save automatically. Stay in fullscreen."); }
  catch (e) { setMessage(e instanceof Error ? e.message : "Fullscreen required"); }
  finally { setBusy(false); }
 }
 function change(id: string, value: string | string[]) {
  if (!full || closing.current) return;
  values.current = { ...values.current, [id]: value }; setAnswers(values.current);
  void send("save", { responses: { [id]: value } }).then(() => setMessage("Answer saved.")).catch(e => setMessage("Save failed: " + e.message));
 }
 async function submit() {
  if (closing.current) return;
  closing.current = true; setBusy(true);
  try { await send("submit", { responses: values.current }); }
  catch (e) { closing.current = false; setBusy(false); setMessage(e instanceof Error ? e.message : "Retry submission"); }
 }
 const q = exam?.questions[index];
 return <main className="min-h-screen bg-[#0c2140] p-6 text-white"><div className="mx-auto max-w-5xl space-y-6">
  <header className="flex justify-between"><div><h1 className="text-2xl font-bold">Secure assessment</h1><p>{studentName} · {registerNumber}</p></div><p role="timer" className="text-3xl">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</p></header>
  <p role="status" className="rounded-xl bg-white/10 p-4">{message}</p>
  {!full || !exam ? <button disabled={busy || !ready} onClick={enter} className="rounded-lg bg-cyan-400 p-4 text-slate-900">Enter fullscreen and resume</button> : q && <>
   <p>Attempt #{exam.attemptNumber} · Violations: {exam.violationCount}/{exam.violationLimit}</p>
   <nav className="flex flex-wrap gap-3">{exam.questions.map((item, i) => <button key={item.id} onClick={() => setIndex(i)} className={i === index ? "bg-cyan-700 p-3" : "bg-white/10 p-3"}>{i + 1}{answers[item.id]?.length ? " ✓" : ""}</button>)}</nav>
   <section className="space-y-4 rounded-xl bg-white/10 p-6"><h2 className="text-2xl">{q.prompt}</h2>
    {["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.type) ? q.options.map(option => <label key={option} className="flex gap-3 rounded-lg border border-white/20 p-4"><input type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"} name={q.id} checked={Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).includes(option) : answers[q.id] === option} onChange={() => { const a = answers[q.id]; const list = Array.isArray(a) ? a : []; change(q.id, q.type === "MULTIPLE_CHOICE" ? list.includes(option) ? list.filter(v => v !== option) : [...list, option] : option); }} />{option}</label>) : <input aria-label="Answer" className="w-full bg-white p-3 text-slate-900" value={String(answers[q.id] ?? "")} onChange={e => change(q.id, e.target.value)} />}
   </section><button disabled={busy} onClick={submit} className="rounded-lg bg-cyan-400 p-4 text-slate-900">Submit assessment</button>
  </>}
 </div></main>;
}
