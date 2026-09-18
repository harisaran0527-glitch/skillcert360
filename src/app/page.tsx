import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Layers,
  GraduationCap,
  Users,
  AlertTriangle,
  ChevronRight,
  UploadCloud,
} from "lucide-react";

export default async function HomePage() {
  const session = await getSession();

  const steps = [
    {
      num: "01",
      icon: Users,
      title: "Admin Account Setup",
      color: "cyan",
      desc: "Admin creates your student account with login credentials, department, and academic level assignment.",
    },
    {
      num: "02",
      icon: Layers,
      title: "Select Skill & Level",
      color: "blue",
      desc: "Choose an active skill aligned with your current progression level (Beginner, Advanced, Pro, or Expert).",
    },
    {
      num: "03",
      icon: BookOpen,
      title: "Select Official Course",
      color: "indigo",
      desc: "Pick an official course provider (Google, AWS, IBM, Microsoft, Coursera, NPTEL, etc.) for your selected skill.",
    },
    {
      num: "04",
      icon: GraduationCap,
      title: "Learn Officially",
      color: "purple",
      desc: "Open the official provider course link and complete the learning directly on the provider's platform.",
    },
    {
      num: "05",
      icon: CheckCircle2,
      title: "Mark Learning Complete",
      color: "teal",
      desc: "After finishing the course, return to SkillCert 360 and mark your learning pathway as complete to unlock SkillLocker.",
    },
    {
      num: "06",
      icon: UploadCloud,
      title: "Upload Original Certificate",
      color: "sky",
      desc: "Upload your original provider certificate file (PDF/Image) to SkillLocker with issuer details and issue date.",
    },
    {
      num: "07",
      icon: ShieldCheck,
      title: "Admin Verification",
      color: "amber",
      desc: "SkillCert 360 Admin reviews the uploaded certificate file for authenticity and sets status to VERIFIED.",
    },
    {
      num: "08",
      icon: Award,
      title: "Verified Progression & Summary",
      color: "emerald",
      desc: "Only VERIFIED certificates unlock higher skill levels and generate an official SkillCert 360 Verified Credential Summary.",
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

      {/* Header / Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white block">SkillCert 360</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Verification Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <Link
              href={session.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/student/login"
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white font-medium text-sm transition hover:bg-slate-800/50"
              >
                Student Portal
              </Link>
              <Link
                href="/admin/login"
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-medium text-sm transition"
              >
                Admin Portal
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-400 mb-8 backdrop-blur-md">
          <Sparkles className="h-4 w-4" /> Official Skill Accreditation &amp; Verification Platform
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Learn Officially. Upload Credentials.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
            Get Verified.
          </span>
        </h1>

        <p className="mt-6 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
          SkillCert 360 is an enterprise skill verification system. Complete courses from official providers, upload your certificates to SkillLocker, and earn verified level progression.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/student/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-base hover:opacity-95 transition shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            Student Login <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/admin/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 font-bold text-base hover:bg-slate-800/80 transition flex items-center justify-center gap-2 text-slate-200"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400" /> Admin Portal
          </Link>
        </div>

        {/* Stats banner */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="text-center">
            <div className="font-display text-2xl sm:text-3xl font-extrabold text-cyan-400">4 Levels</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Beginner to Expert</div>
          </div>
          <div className="text-center border-l border-slate-800">
            <div className="font-display text-2xl sm:text-3xl font-extrabold text-blue-400">SkillLocker</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Secure Private Storage</div>
          </div>
          <div className="text-center border-l border-slate-800">
            <div className="font-display text-2xl sm:text-3xl font-extrabold text-indigo-400">Admin Audit</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Verification Control</div>
          </div>
          <div className="text-center border-l border-slate-800">
            <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">Instant PDF</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Verified Credential Summary</div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 uppercase tracking-widest">
            End-to-End Skill Flow
          </div>
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">How SkillCert 360 Works</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From initial course selection to admin verification and official progression.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const colors = colorMap[step.color] || colorMap.cyan;
            const IconComponent = step.icon;
            return (
              <div
                key={step.num}
                className={`glass-panel p-6 border-l-4 ${colors.border} flex flex-col justify-between hover:translate-y-[-2px] transition duration-200`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${colors.badge}`}>
                      STEP {step.num}
                    </span>
                    <div className={`p-2 rounded-lg border ${colors.icon}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
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
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">SkillLocker Storage</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Secure private blob upload for original provider certificates with SHA-256 duplicate detection.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Admin Verification Audit</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Admin checks original documents, validates provider matching, and approves or rejects submissions.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Verified Level Progression</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Threshold-based level unlocking (Advanced, Pro, Expert) driven strictly by VERIFIED certificates.
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
            <h2 className="font-display text-3xl font-extrabold text-white">Student Guidelines</h2>
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
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />Complete the entire course on the official provider platform.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />Mark learning complete only after finishing official course requirements.</li>
              </ul>
            </div>

            {/* Upload Rules */}
            <div className="glass-panel p-6 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">SkillLocker Upload</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Upload original certificate file issued by official provider.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Supported formats: PDF, PNG, JPG, WEBP up to 10 MB.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Provide accurate issue date and matching provider details.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />Fraudulent or altered certificates will be rejected by Admin.</li>
              </ul>
            </div>

            {/* Verification Rules */}
            <div className="glass-panel p-6 space-y-3">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2">Verification</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Uploaded certificates start in PENDING_VERIFICATION status.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Admin reviews uploaded files and sets status to VERIFIED or REJECTED.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Only VERIFIED certificates count toward skill level progression.</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />Verified credentials receive an official SkillCert 360 record ID.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-8 bg-slate-950/80">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">SkillCert 360</span> &bull; Official Skill Accreditation &amp; Verification System
          </div>
          <div>&copy; {new Date().getFullYear()} SkillCert 360. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
