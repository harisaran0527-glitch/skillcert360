import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  LogIn,
  UserCheck,
  FileCheck2,
  ClipboardList,
  MonitorCheck,
  Trophy,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const steps = [
    {
      num: "01",
      icon: LogIn,
      title: "Sign In",
      color: "cyan",
      desc: "Students receive their login credentials from the Admin. Accounts are created and issued by an authorised administrator.",
    },
    {
      num: "02",
      icon: BookOpen,
      title: "Choose a Skill",
      color: "blue",
      desc: "Browse industry-relevant skills including C, C++, Python, Java, JavaScript, Web Development, AI, Machine Learning, Cloud, SQL, and more.",
    },
    {
      num: "03",
      icon: UserCheck,
      title: "Choose an Official Provider",
      color: "indigo",
      desc: "Each skill lists verified learning providers (e.g. Cisco, IBM, Microsoft, Oracle). Select your official learning pathway.",
    },
    {
      num: "04",
      icon: MonitorCheck,
      title: "Learn Officially",
      color: "purple",
      desc: "Open the official provider course and complete the learning directly on the provider's platform.",
    },
    {
      num: "05",
      icon: CheckCircle2,
      title: "Mark Learning Complete",
      color: "teal",
      desc: "After finishing the course, return to SkillCert 360 and mark the learning pathway as complete to unlock certificate requesting.",
    },
    {
      num: "06",
      icon: FileCheck2,
      title: "Submit Certificate Request",
      color: "sky",
      desc: "Confirm your student details, course title, and provider information in the Certificate Request Form and submit your request.",
    },
    {
      num: "07",
      icon: ShieldCheck,
      title: "Take Internal Assessment",
      color: "amber",
      desc: "Complete the proctored assessment with 50 randomized questions, anti-cheat tab-switch detection, timer, and server-side scoring.",
    },
    {
      num: "08",
      icon: Trophy,
      title: "Pass Assessment & Issue Certificate",
      color: "emerald",
      desc: "Achieve a passing score of 50% or higher. Upon passing, your certificate instantly unlocks from LOCKED to AVAILABLE / ISSUED with a unique verification code.",
    },
  ];

  const colorMap: Record<string, { badge: string; num: string; icon: string; border: string }> = {
    cyan:    { badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",    num: "text-cyan-400",    icon: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",    border: "border-l-cyan-500" },
    blue:    { badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",    num: "text-blue-400",    icon: "bg-blue-500/10 border-blue-500/20 text-blue-400",    border: "border-l-blue-500" },
    indigo:  { badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",  num: "text-indigo-400",  icon: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",  border: "border-l-indigo-500" },
    purple:  { badge: "border-purple-500/30 bg-purple-500/10 text-purple-400",  num: "text-purple-400",  icon: "bg-purple-500/10 border-purple-500/20 text-purple-400",  border: "border-l-purple-500" },
    teal:    { badge: "border-teal-500/30 bg-teal-500/10 text-teal-400",    num: "text-teal-400",    icon: "bg-teal-500/10 border-teal-500/20 text-teal-400",    border: "border-l-teal-500" },
    sky:     { badge: "border-sky-500/30 bg-sky-500/10 text-sky-400",      num: "text-sky-400",     icon: "bg-sky-500/10 border-sky-500/20 text-sky-400",      border: "border-l-sky-500" },
    amber:   { badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",   num: "text-amber-400",   icon: "bg-amber-500/10 border-amber-500/20 text-amber-400",   border: "border-l-amber-500" },
    emerald: { badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", num: "text-emerald-400", icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", border: "border-l-emerald-500" },
    rose:    { badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",    num: "text-rose-400",    icon: "bg-rose-500/10 border-rose-500/20 text-rose-400",    border: "border-l-rose-500" },
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-white selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      {/* Background glow layers */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-60 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-60 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              SkillCert <span className="text-cyan-400">360</span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              Verified Progression
            </span>
          </div>
        </Link>

        <Link
          href="/student/login"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
        >
          <LogIn className="w-4 h-4" /> Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" /> Verified Skill Certification Platform
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
            Discover Skills. Learn Officially. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Get Verified.
            </span>
          </h1>

          <p className="text-base text-slate-400 sm:text-lg leading-relaxed max-w-2xl mx-auto">
            SkillCert 360 helps students discover industry-relevant skills, learn using official provider courses, mark learning complete, submit certificate requests, pass secure assessments, and earn verified skill certificates.
          </p>

          <div className="pt-4">
            <Link
              href="/student/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 4-Level Progression Grid */}
        <div className="mt-20 pt-10 border-t border-slate-800/80">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Level Journey</h2>
            <p className="text-2xl font-bold text-white">4-Level Certificate Progression</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Beginner</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <Unlock className="w-3 h-3" /> Available
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Available immediately on enrolment. No prior certificates required.</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">Req: 0 Certificates</div>
            </div>

            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Advanced</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Unlocks after earning 25 verified Beginner credentials.</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-blue-400 font-mono font-semibold">Unlock: 25 Verified Beginner Certs</div>
            </div>

            <div className="glass-panel p-6 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Pro</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Unlocks after earning 50 verified Advanced credentials.</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-purple-400 font-mono font-semibold">Unlock: 50 Verified Advanced Certs</div>
            </div>

            <div className="glass-panel p-6 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Expert</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Unlocks after earning 75 verified Pro credentials.</p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 font-mono font-semibold">Unlock: 75 Verified Pro Certs</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 bg-slate-950/60 border-y border-slate-800/80 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 uppercase tracking-widest">
              <BookOpen className="w-3.5 h-3.5" /> Student Guide
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">How SkillCert 360 Works</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">A clear step-by-step journey from sign-in to verified certificates.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const c = colorMap[step.color];
              const Icon = step.icon;
              return (
                <div key={step.num} className={`glass-panel p-6 border-l-4 ${c.border} space-y-3`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${c.icon} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`font-mono text-xl font-bold ${c.num}`}>{step.num}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Platform Integrity</h2>
          <p className="text-2xl font-bold text-white">Built for Trust</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Proctored Assessment</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Tab-switch monitoring, heartbeat locks, answer autosave, violation tracking, and server-side scoring.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Admin Certificate Audit</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Admin tracks student progress, reviews certificate requests, and audits issued credentials.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Real Analytics</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Live database metrics, instant progression recalculations, and transparent audit trails for every student.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Rules */}
      <section className="relative z-10 bg-slate-950/60 border-y border-slate-800/80 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" /> Student Responsibilities
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white">Student Rules</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Account Rules */}
            <div className="glass-panel p-6 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Account</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />Student accounts are created only by Admin. Self-registration is not permitted.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />Do not share login credentials with others.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />Temporary password must be changed on first login.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />One student must use only their own account.</li>
              </ul>
            </div>

            {/* Learning Rules */}
            <div className="glass-panel p-6 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Learning</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />Use the official provider course linked in SkillCert 360.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />Do not mark learning complete without genuinely finishing the course.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />Course and certificate availability depend on official provider content.</li>
              </ul>
            </div>

            {/* Assessment Rules */}
            <div className="glass-panel p-6 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Assessment</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Submit Certificate Request before starting the assessment.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Fullscreen may be required. Do not exit fullscreen during assessment.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Do not switch tabs or windows during assessment.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Do not copy or paste assessment content.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Violations may result in automatic termination.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Refreshing the page will not reset the server timer.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Re-exam cooldown rules must be followed.</li>
              </ul>
            </div>

            {/* Credential Rules */}
            <div className="glass-panel p-6 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Certificates</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Submit accurate details in the Certificate Request Form.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Complete the assessment legitimately to earn your certificate.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Passing score of ≥ 50% automatically unlocks the certificate.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Certificates feature unique verification codes and QR links.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Earned certificates count directly toward level progression.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-8 bg-slate-950/80">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <span>© {new Date().getFullYear()} SkillCert 360 Platform. All rights reserved.</span>
          </div>
          <Link href="/student/login" className="hover:text-slate-300 transition">
            Sign In
          </Link>
        </div>
      </footer>
    </main>
  );
}
