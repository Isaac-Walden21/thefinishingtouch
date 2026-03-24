"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitPullRequestArrow,
  Users,
  Settings,
  Hammer,
  Calculator,
  Camera,
  FileText,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: GitPullRequestArrow },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/estimates", label: "Estimates", icon: Calculator },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/vision", label: "Vision Studio", icon: Camera },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#0f1729] border-r border-slate-700/50">
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <Hammer className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">
            The Finishing Touch
          </h1>
          <p className="text-[11px] text-slate-400">CRM Platform</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            MH
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Mike Henderson
            </p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
