"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Workflow,
  Play,
  Pause,
  Mail,
  Clock,
  Users,
  CheckCircle,
  ChevronDown,
  Zap,
  Plus,
  X,
  Eye,
  BarChart3,
  UserMinus,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import { demoAutomations } from "@/lib/demo-data";
import { AUTOMATION_STATUS_CONFIG } from "@/lib/types";

const MARKETING_TABS = [
  { href: "/marketing/contacts", label: "Contacts" },
  { href: "/marketing/templates", label: "Templates" },
  { href: "/marketing/campaigns", label: "Campaigns" },
  { href: "/marketing/automations", label: "Automations" },
  { href: "/marketing/referrals", label: "Referrals" },
];

const TRIGGERS = [
  "New lead created",
  "Lead status changes to...",
  "Job completed",
  "Customer created",
  "Tag added",
  "Manual enrollment",
];

export default function MarketingAutomationsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enrolledView, setEnrolledView] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(demoAutomations.map((a) => [a.id, a.status]))
  );
  const [showCreate, setShowCreate] = useState(false);

  const toggleStatus = (id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: prev[id] === "active" ? "paused" : "active" }));
  };

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>Automations</h1>
          <p className="mt-1 text-sm text-slate-500">Drip sequences that run automatically based on CRM triggers.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">
          <Plus className="h-4 w-4" /> New Automation
        </button>
      </div>

      {/* Sub-nav */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {MARKETING_TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={clsx("rounded-md px-4 py-2 text-sm font-medium", tab.href === "/marketing/automations" ? "bg-[#0085FF]/10 text-[#0085FF]" : "text-slate-500 hover:text-slate-700")}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Automations list */}
      <div className="space-y-6">
        {demoAutomations.map((automation) => {
          const currentStatus = statuses[automation.id] ?? automation.status;
          const statusConfig = AUTOMATION_STATUS_CONFIG[currentStatus as keyof typeof AUTOMATION_STATUS_CONFIG] ?? AUTOMATION_STATUS_CONFIG.draft;
          const isExpanded = expandedId === automation.id;
          const showingEnrolled = enrolledView === automation.id;

          return (
            <div key={automation.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2.5 bg-purple-50">
                    <Workflow className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#0F172A]">{automation.name}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{automation.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEnrolledView(showingEnrolled ? null : automation.id)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                    <Eye className="h-3 w-3" /> Enrolled
                  </button>
                  <button onClick={() => toggleStatus(automation.id)} className={clsx("rounded-lg p-2 transition-colors", currentStatus === "active" ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}>
                    {currentStatus === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setExpandedId(isExpanded ? null : automation.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                    <ChevronDown className={clsx("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-xs text-slate-400 mb-2">
                <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Trigger: {automation.trigger}</div>
                <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {automation.emails.length} email{automation.emails.length !== 1 ? "s" : ""}</div>
                <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {automation.enrolled_count} enrolled</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> {automation.completed_count} completed</div>
              </div>

              {/* Enrollment table */}
              {showingEnrolled && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-medium text-slate-500 uppercase mb-3">Currently Enrolled</h4>
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                        <th className="px-3 py-2 text-left">Contact</th>
                        <th className="px-3 py-2 text-left">Current Step</th>
                        <th className="px-3 py-2 text-left">Next Email</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr><td className="px-3 py-2 text-slate-700">Steve Morales</td><td className="px-3 py-2 text-slate-500">Email 2</td><td className="px-3 py-2 text-slate-500">Mar 30</td><td className="px-3 py-2"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">Active</span></td></tr>
                        <tr><td className="px-3 py-2 text-slate-700">Brian Whitfield</td><td className="px-3 py-2 text-slate-500">Email 1</td><td className="px-3 py-2 text-slate-500">Mar 31</td><td className="px-3 py-2"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">Active</span></td></tr>
                        <tr><td className="px-3 py-2 text-slate-700">Rachel Kim</td><td className="px-3 py-2 text-slate-500">Completed</td><td className="px-3 py-2 text-slate-500">--</td><td className="px-3 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Done</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Email sequence */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-slate-500 uppercase">Email Sequence</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Funnel: {automation.enrolled_count} enrolled -- {automation.completed_count} completed ({automation.enrolled_count > 0 ? Math.round((automation.completed_count / automation.enrolled_count) * 100) : 0}%)</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {automation.emails.map((email, i) => (
                      <div key={email.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0085FF]/10 text-xs font-bold text-[#0085FF]">{i + 1}</div>
                          {i < automation.emails.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                        </div>
                        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-slate-700">{email.subject}</p>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="h-3 w-3" />
                                {email.delay_days === 0 ? "Immediately" : `After ${email.delay_days} day${email.delay_days !== 1 ? "s" : ""}`}
                              </span>
                              {/* Per-email stats */}
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Eye className="h-3 w-3" /> 42%
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <BarChart3 className="h-3 w-3" /> 12%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">{email.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Automation Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#0F172A]">New Automation</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input type="text" placeholder="e.g. New Lead Welcome Sequence" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Trigger</label>
                <select className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none">
                  <option value="">Select trigger...</option>
                  {TRIGGERS.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea rows={2} placeholder="What does this automation do?" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm resize-none focus:border-[#0085FF] focus:outline-none" />
              </div>
              <p className="text-xs text-slate-400">You can add emails to the sequence after creating the automation.</p>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">Create Automation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
