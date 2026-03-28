"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  HardHat,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: GitPullRequestArrow },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/estimates/job-walk", label: "Job Walk", icon: HardHat },
  { href: "/estimates", label: "Estimates", icon: Calculator },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/vision", label: "Vision Studio", icon: Camera },
  { href: "/agents", label: "AI Agents", icon: Bot },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#0F172A]">
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#0085FF] text-white shadow-lg shadow-[#0085FF]/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0085FF] text-xs font-bold text-white">
            MH
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Mike Henderson
            </p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
