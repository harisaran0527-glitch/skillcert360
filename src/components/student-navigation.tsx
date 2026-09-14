"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Award,
  FileCheck,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

interface StudentNavProps {
  studentName?: string;
  registerNumber?: string;
}

export function StudentNavigation({ studentName = "Student", registerNumber = "" }: StudentNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Courses / Learning", href: "/student/skills", icon: Compass },
    { label: "Assessments", href: "/student/assessment", icon: Award },
    { label: "Certificates", href: "/student/certificates", icon: FileCheck },
    { label: "Profile", href: "/student/profile", icon: User },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/student/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#070b14]/90 px-4 backdrop-blur-md">
        <Link href="/student/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-base tracking-tight">SkillCert<span className="text-cyan-400">360</span></span>
            <span className="block text-[10px] uppercase tracking-wider text-cyan-400/80 font-medium">Student Portal</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-[#070b14] transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-800/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight text-white">
              SkillCert<span className="text-cyan-400">360</span>
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Student Portal
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/15 to-blue-600/10 text-cyan-300 font-semibold border border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-slate-900/60 text-slate-400 group-hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white font-bold text-sm shadow-sm">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-bold text-white">{studentName}</p>
              <p className="truncate text-[11px] text-slate-400 font-mono">{registerNumber}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/80 px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
