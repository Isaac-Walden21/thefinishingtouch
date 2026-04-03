"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  GitPullRequestArrow,
  Users,
  Settings,
  Calculator,
  Camera,
  FileText,
  Bot,
  Megaphone,
  Calendar,
  ClipboardCheck,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: GitPullRequestArrow },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/estimates", label: "Estimates", icon: Calculator },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/job-walk", label: "Job Walk", icon: ClipboardCheck },
  { href: "/vision", label: "Vision Studio", icon: Camera },
  { href: "/agents", label: "AI Agents", icon: Bot },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
];

function CompanySwitcher({ currentCompanyId }: { currentCompanyId: string }) {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function switchCompany(companyId: string) {
    document.cookie = `x-impersonate-company=${companyId};path=/;max-age=${60 * 60 * 24}`;
    window.location.reload();
  }

  async function clearImpersonation() {
    document.cookie = "x-impersonate-company=;path=/;max-age=0";
    window.location.reload();
  }

  return (
    <div className="border-b border-white/10 px-3 py-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Super Admin
      </p>
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-left text-xs text-white hover:bg-white/20"
      >
        {companies.find((c) => c.id === currentCompanyId)?.name ?? "Select company"}
      </button>
      {open && (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-lg bg-white/10">
          <button
            onClick={clearImpersonation}
            className="w-full px-3 py-2 text-left text-xs text-amber-300 hover:bg-white/10"
          >
            My Account (stop impersonating)
          </button>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => { switchCompany(c.id); setOpen(false); }}
              className={clsx(
                "w-full px-3 py-2 text-left text-xs text-white hover:bg-white/10",
                c.id === currentCompanyId && "bg-white/20"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, company, logout } = useAuth();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-navy p-2 text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-navy transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1 text-white/60 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand header */}
        <div className="flex items-center justify-center border-b border-white/10 px-1 py-1">
          <Image
            src="/logo.png"
            alt="The Finishing Touch LLC"
            width={100}
            height={37}
            className="object-contain"
            priority
          />
        </div>

        {/* Super-admin company switcher */}
        {user?.is_super_admin && (
          <CompanySwitcher currentCompanyId={company?.id ?? ""} />
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="mt-auto border-t border-white/10 px-3 py-4">
          {user && (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{company?.name}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
