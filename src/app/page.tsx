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
  Zap,
  BookOpen,
  ChevronRight,
} from "lucide-react";

export default function Home() {
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

        <div className="flex items-center gap-4">
          <Link
            href="/student/login"
            className="text-xs font-semibold text-slate-300 hover:text-white transition px-3 py-2"
          >
            Student Sign In
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-bold text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/50 transition shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Control
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" /> Next-Generation EdTech Certification Platform
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
            Master Verified Skills. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Unlock Progression Levels.
            </span>
          </h1>

          <p className="text-base text-slate-400 sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Learn from recognized global providers, take proctored internal skill assessments, and unlock advanced tiers with verified official certificates.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/student/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
            >
              Enter Student Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/student/skills"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-8 py-4 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition"
            >
              Explore Skill Catalogue
            </Link>
          </div>
        </div>

        {/* 4-Level Progression Grid Preview */}
        <div className="mt-20 pt-10 border-t border-slate-800/80">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Structured Tier Progression</h2>
            <p className="text-2xl font-bold text-white">4-Level Certificate Lock & Unlock System</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Level 1 */}
            <div className="glass-panel p-6 border-l-4 border-l-emerald-500 relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Level 1</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <Unlock className="w-3 h-3" /> Default Unlocked
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-white">Beginner</h3>
              <p className="mt-2 text-xs text-slate-400">
                Foundational skills accessible to all newly enrolled students immediately.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                Req: 0 Certificates
              </div>
            </div>

            {/* Level 2 */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500 relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Level 2</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-white">Advanced</h3>
              <p className="mt-2 text-xs text-slate-400">
                Intermediate domain skills requiring verified beginner mastery.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-blue-400 font-mono font-semibold">
                Unlock: 25 Verified Beginner Certs
              </div>
            </div>

            {/* Level 3 */}
            <div className="glass-panel p-6 border-l-4 border-l-purple-500 relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Level 3</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-white">Pro</h3>
              <p className="mt-2 text-xs text-slate-400">
                Advanced architectural and engineering proficiencies.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-purple-400 font-mono font-semibold">
                Unlock: 50 Verified Advanced Certs
              </div>
            </div>

            {/* Level 4 */}
            <div className="glass-panel p-6 border-l-4 border-l-amber-500 relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Level 4</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-white">Expert</h3>
              <p className="mt-2 text-xs text-slate-400">
                Elite specialist certifications & enterprise-level mastery.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 font-mono font-semibold">
                Unlock: 75 Verified Pro Certs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Trust Loop Section */}
      <section className="relative z-10 bg-slate-950/60 border-y border-slate-800/80 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5" /> Verification Workflow
              </div>
              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                The SkillCert 360 <br />
                <span className="text-cyan-400">Trust Loop</span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Our dual-verification mechanism ensures every certificate granted carries real academic weight and institutional trust.
              </p>
            </div>

            <div className="lg:col-span-7 grid gap-6 sm:grid-cols-3">
              <div className="glass-panel p-6 space-y-3">
                <div className="text-2xl font-mono font-bold text-cyan-400">01</div>
                <h3 className="font-bold text-white text-base">Learn Officially</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enroll in authorized courses from recognized learning providers.
                </p>
              </div>

              <div className="glass-panel p-6 space-y-3">
                <div className="text-2xl font-mono font-bold text-blue-400">02</div>
                <h3 className="font-bold text-white text-base">Pass Internally</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Demonstrate core mastery via proctored internal timed assessments.
                </p>
              </div>

              <div className="glass-panel p-6 space-y-3">
                <div className="text-2xl font-mono font-bold text-purple-400">03</div>
                <h3 className="font-bold text-white text-base">Verify Externally</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Submit official certificates for admin verification & level unlock credit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Platform Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Proctored Security</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Tab switch monitoring, heartbeat locks, answer autosave, and strict violation handling.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Admin Credential Audit</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Manual admin verification pipeline ensuring authentic certificate credentials.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">100% Real Analytics</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Real database query metrics, instant standing recalculations, and transparent audit trails.
              </p>
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
          <div className="flex items-center gap-6">
            <Link href="/student/login" className="hover:text-slate-300 transition">
              Student Login
            </Link>
            <Link href="/admin/login" className="hover:text-slate-300 transition">
              Admin Control Center
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
