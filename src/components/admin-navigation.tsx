"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Building,
  GraduationCap,
  HelpCircle,
  Award,
  FileCheck2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Command,
  Loader2,
} from "lucide-react";

interface AdminNavProps {
  adminEmail?: string;
}

export function AdminNavigation({ adminEmail = "Admin" }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Skills", href: "/admin/skills", icon: BookOpen },
    { label: "Courses", href: "/admin/courses", icon: GraduationCap },
    { label: "Providers", href: "/admin/providers", icon: Building },
    { label: "SkillLocker HQ", href: "/admin/certificates", icon: FileCheck2 },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-[#0b0f19] px-4 backdrop-blur-md">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
            <Command className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display font-extrabold text-white text-base tracking-tight">
              SkillCert<span className="text-indigo-400">HQ</span>
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-indigo-400/90 font-bold">Command Center</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          aria-label="Toggle Command Navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Backdrop overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-[#080c16] transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Command className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight text-white">
              SkillCert<span className="text-indigo-400">HQ</span>
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
              Command Center
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Admin Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            const isPending = pendingHref === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (pathname !== item.href) {
                    setPendingHref(item.href);
                  }
                }}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-500/5 font-bold"
                    : isPending
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      isActive || isPending
                        ? "bg-indigo-500/25 text-indigo-300"
                        : "bg-slate-900 text-slate-500 group-hover:text-slate-200"
                    }`}
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span>{item.label}</span>
                </div>
                {isPending ? (
                  <span className="text-[10px] text-indigo-400 font-mono font-bold animate-pulse">Loading...</span>
                ) : isActive ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Admin Card & Sign Out */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs">
              HQ
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-bold text-white">{adminEmail}</p>
              <p className="truncate text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Super Administrator</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{loggingOut ? "Exiting HQ..." : "Sign Out HQ"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
