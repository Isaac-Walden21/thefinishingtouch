"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  UserPlus,
  FileText,
  Star,
  MessageCircle,
  Play,
  Pause,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Zap,
  Bell,
  Sun,
  Shield,
  X,
  ThumbsUp,
  Pencil,
  ThumbsDown,
} from "lucide-react";
import clsx from "clsx";
import { demoAgents, demoAgentActions } from "@/lib/demo-data";
import StatsCard from "@/components/StatsCard";
import type { AIAgent, AgentType } from "@/lib/types";

const agentIcons: Record<AgentType, typeof Bot> = {
  lead_followup: UserPlus,
  quote_followup: FileText,
  review_request: Star,
  website_chatbot: MessageCircle,
  job_completion: CheckCircle2,
  appointment_reminder: Bell,
  seasonal_reengagement: Sun,
};

const agentColors: Record<AgentType, { text: string; bg: string; border: string }> = {
  lead_followup: { text: "text-[#0085FF]", bg: "bg-[#0085FF]/10", border: "border-[#0085FF]/30" },
  quote_followup: { text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  review_request: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  website_chatbot: { text: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  job_completion: { text: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  appointment_reminder: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  seasonal_reengagement: { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>(demoAgents);
  const [allPaused, setAllPaused] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [approvalAction, setApprovalAction] = useState<string | null>(null);

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a))
    );
  };

  const handlePauseAll = () => {
    setAgents((prev) => prev.map((a) => ({ ...a, status: "paused" })));
    setAllPaused(true);
    setShowPauseConfirm(false);
  };

  const handleResumeAll = () => {
    setAgents((prev) => prev.map((a) => ({ ...a, status: "active" })));
    setAllPaused(false);
  };

  const totalActionsToday = agents.reduce((sum, a) => sum + a.actions_today, 0);
  const totalActionsWeek = agents.reduce((sum, a) => sum + a.actions_this_week, 0);
  const activeCount = agents.filter((a) => a.status === "active").length;

  const pendingActions = demoAgentActions.filter((a) => a.status === "pending_approval");
  const recentActions = [...demoAgentActions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Paused Banner */}
      {allPaused && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <Shield className="h-4 w-4" />
            All agents paused -- no automated messages will be sent
          </div>
          <button
            onClick={handleResumeAll}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Resume All
          </button>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>AI Agents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Automated assistants that handle follow-ups, reviews, and customer engagement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingActions.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              {pendingActions.length} pending approval{pendingActions.length > 1 ? "s" : ""}
            </div>
          )}
          <button
            onClick={() => setShowPauseConfirm(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <Pause className="h-4 w-4" />
            Pause All Agents
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard title="Active Agents" value={activeCount} subtitle={`of ${agents.length} total`} icon={Bot} color="emerald" />
        <StatsCard title="Actions Today" value={totalActionsToday} subtitle="Automated tasks" icon={Zap} color="blue" />
        <StatsCard title="This Week" value={totalActionsWeek} subtitle="Total actions" icon={Clock} color="purple" />
        <StatsCard title="Pending Approvals" value={pendingActions.length} subtitle="Need review" icon={AlertTriangle} color="orange" />
      </div>

      {/* Pending Approvals Section */}
      {pendingActions.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/50 p-6">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Pending Approvals</h2>
          <div className="space-y-3">
            {pendingActions.map((action) => {
              const agent = agents.find((a) => a.id === action.agent_id);
              const Icon = agent ? agentIcons[agent.type] : Bot;
              const colors = agent ? agentColors[agent.type] : agentColors.lead_followup;

              return (
                <div key={action.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${colors.bg}`}>
                        <Icon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{action.description}</p>
                        <p className="text-xs text-slate-400">{agent?.name} -- {formatTimeAgo(action.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Draft message preview */}
                  <div className="mb-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Message Draft:</p>
                    <p className="text-sm text-slate-700">
                      Hi there, this is Evan from The Finishing Touch. Just following up on your project inquiry...
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                      <ThumbsUp className="h-3 w-3" /> Approve and Send
                    </button>
                    <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                      <Pencil className="h-3 w-3" /> Edit and Send
                    </button>
                    <button className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                      <ThumbsDown className="h-3 w-3" /> Reject
                    </button>
                    {action.customer_id && (
                      <Link
                        href={`/customers/${action.customer_id}`}
                        className="ml-auto text-xs text-[#0085FF] hover:underline"
                      >
                        View Customer
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {agents.map((agent) => {
          const Icon = agentIcons[agent.type] || Bot;
          const colors = agentColors[agent.type] || agentColors.lead_followup;
          return (
            <div
              key={agent.id}
              className={clsx(
                "rounded-xl border bg-white shadow-sm p-6",
                agent.status === "active" ? colors.border : "border-slate-200"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${colors.bg}`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">{agent.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {agent.status === "active" ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-slate-400">Paused</span>
                      )}
                      {agent.last_run && ` -- Last run ${formatTimeAgo(agent.last_run)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={clsx(
                    "rounded-lg p-2 transition-colors",
                    agent.status === "active"
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {agent.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">{agent.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{agent.actions_today} today</span>
                  <span>{agent.actions_this_week} this week</span>
                  <span className="capitalize">
                    {agent.config.approval_mode === "auto_send" ? "Auto-send" : "Approval required"}
                  </span>
                </div>
                <Link href={`/agents/${agent.id}`} className="flex items-center gap-1 text-xs text-[#0085FF] hover:text-[#0177E3]">
                  <Settings className="h-3.5 w-3.5" /> Configure
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Log */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Agent Activity Log</h2>
        <div className="space-y-3">
          {recentActions.map((action) => {
            const agent = agents.find((a) => a.id === action.agent_id);
            const AgentIcon = agent ? (agentIcons[agent.type] || Bot) : Bot;
            const colors = agent ? (agentColors[agent.type] || agentColors.lead_followup) : agentColors.lead_followup;
            return (
              <div key={action.id} className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className={`rounded-lg p-2 ${colors.bg}`}>
                  <AgentIcon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{action.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-slate-400">{agent?.name}</p>
                    <span className="text-xs text-slate-300">--</span>
                    <p className="text-xs text-slate-400">{formatTimeAgo(action.created_at)}</p>
                    {action.customer_id && (
                      <>
                        <span className="text-xs text-slate-300">--</span>
                        <Link href={`/customers/${action.customer_id}`} className="text-xs text-[#0085FF] hover:underline">
                          View Customer
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  {action.status === "completed" && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                      <CheckCircle className="h-3 w-3" /> Done
                    </span>
                  )}
                  {action.status === "pending_approval" && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" /> Pending
                    </span>
                  )}
                  {action.status === "failed" && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-500">Failed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pause Confirmation Modal */}
      {showPauseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">Pause All Agents?</h3>
              <button onClick={() => setShowPauseConfirm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              This will pause all automated messages. No agent will send anything until you re-enable them.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowPauseConfirm(false)} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handlePauseAll} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">
                Pause All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
