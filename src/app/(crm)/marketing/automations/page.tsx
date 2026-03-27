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
} from "lucide-react";
import { demoAutomations } from "@/lib/demo-data";
import { AUTOMATION_STATUS_CONFIG } from "@/lib/types";

export default function MarketingAutomationsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(demoAutomations.map((a) => [a.id, a.status]))
  );

  const toggleStatus = (id: string) => {
    setStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === "active" ? "paused" : "active",
    }));
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Automations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drip sequences that run automatically based on CRM triggers.
          </p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <Link href="/marketing/contacts" className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
          Contacts
        </Link>
        <Link href="/marketing/templates" className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
          Templates
        </Link>
        <Link href="/marketing/campaigns" className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
          Campaigns
        </Link>
        <Link href="/marketing/automations" className="rounded-md bg-[#0085FF]/10 px-4 py-2 text-sm font-medium text-[#0085FF]">
          Automations
        </Link>
      </div>

      {/* Automations list */}
      <div className="space-y-6">
        {demoAutomations.map((automation) => {
          const currentStatus = statuses[automation.id] ?? automation.status;
          const statusConfig =
            AUTOMATION_STATUS_CONFIG[currentStatus as keyof typeof AUTOMATION_STATUS_CONFIG] ??
            AUTOMATION_STATUS_CONFIG.draft;
          const isExpanded = expandedId === automation.id;

          return (
            <div
              key={automation.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2.5 bg-purple-50">
                    <Workflow className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#0F172A]">
                        {automation.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {automation.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(automation.id)}
                    className={`rounded-lg p-2 transition-colors ${
                      currentStatus === "active"
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {currentStatus === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : automation.id)
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-xs text-slate-400 mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Trigger: {automation.trigger}
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {automation.emails.length} email{automation.emails.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {automation.enrolled_count} enrolled
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {automation.completed_count} completed
                </div>
              </div>

              {/* Expanded: email sequence */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-3 uppercase">
                    Email Sequence
                  </p>
                  <div className="space-y-3">
                    {automation.emails.map((email, i) => (
                      <div key={email.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0085FF]/10 text-xs font-bold text-[#0085FF]">
                            {i + 1}
                          </div>
                          {i < automation.emails.length - 1 && (
                            <div className="w-px flex-1 bg-slate-200 my-1" />
                          )}
                        </div>
                        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-slate-700">
                              {email.subject}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="h-3 w-3" />
                              {email.delay_days === 0
                                ? "Immediately"
                                : `After ${email.delay_days} day${email.delay_days !== 1 ? "s" : ""}`}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {email.body}
                          </p>
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
    </div>
  );
}
