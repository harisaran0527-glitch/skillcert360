import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentProgression } from "@/lib/progression";
import {
  User,
  ShieldCheck,
  Award,
  BookOpen,
  Mail,
  GraduationCap,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

export default async function StudentProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const profile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { email: true, createdAt: true } },
      department: true,
      section: true,
    },
  });

  if (!profile) redirect("/student/login");

  const progression = await getStudentProgression(profile.id);
  const currentHighestLevel = progression.levels.filter((l) => l.unlocked).pop()?.name || "Beginner";
  const verifiedCertsCount = progression.levels.reduce((sum, l) => sum + l.verifiedCount, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-8 border-cyan-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 font-display text-3xl font-extrabold text-white shadow-xl shadow-cyan-500/20">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Verified Student Profile</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">{profile.fullName}</h1>
            <p className="text-xs text-slate-400 font-mono">
              Register Number: <strong className="text-cyan-400">{profile.registerNumber}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal & Academic Credentials */}
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-cyan-400" />
            <span>Academic Information</span>
          </h2>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" /> Email Address
              </span>
              <span className="font-semibold text-white font-mono">{profile.user.email}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-500" /> Department
              </span>
              <span className="font-semibold text-white">{profile.department.name}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" /> Academic Year
              </span>
              <span className="font-semibold text-white">Year {profile.year}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500" /> Section
              </span>
              <span className="font-semibold text-white">Section {profile.section.name}</span>
            </div>
          </div>
        </div>

        {/* Skill Progression Overview */}
        <div className="glass-panel rounded-3xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Skill Progression Standing</span>
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
                <span className="text-slate-300 font-semibold">Current Progression Level</span>
                <span className="font-extrabold text-cyan-300 text-sm font-display">{currentHighestLevel} Tier</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                <span className="text-slate-300 font-semibold">Total Verified Credentials</span>
                <span className="font-extrabold text-emerald-300 text-sm font-mono">{verifiedCertsCount} Certificates</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <Link href="/student/dashboard" className="text-cyan-400 hover:underline font-semibold">
              View Dashboard
            </Link>
            <Link href="/student/certificates" className="text-emerald-400 hover:underline font-semibold">
              Manage Credentials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
