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
  AlertTriangle,
  Settings,
  Zap,
} from "lucide-react";
import { demoAgents, demoAgentActions } from "@/lib/demo-data";
import type { AIAgent, AgentType } from "@/lib/types";

const agentIcons: Record<AgentType, typeof Bot> = {
  lead_followup: UserPlus,
  quote_followup: FileText,
  review_request: Star,
  website_chatbot: MessageCircle,
};

const agentColors: Record<AgentType, { text: string; bg: string; border: string }> = {
  lead_followup: { text: "text-[#0085FF]", bg: "bg-[#0085FF]/10", border: "border-[#0085FF]/30" },
  quote_followup: { text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  review_request: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  website_chatbot: { text: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
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

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a
      )
    );
  };

  const totalActionsToday = agents.reduce((sum, a) => sum + a.actions_today, 0);
  const totalActionsWeek = agents.reduce((sum, a) => sum + a.actions_this_week, 0);
  const activeCount = agents.filter((a) => a.status === "active").length;
  const pendingApprovals = demoAgentActions.filter((a) => a.status === "pending_approval").length;

  const recentActions = [...demoAgentActions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">AI Agents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Automated assistants that handle follow-ups, reviews, and customer engagement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingApprovals > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              {pendingApprovals} pending approval{pendingApprovals > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Agents</p>
              <p className="mt-2 text-3xl font-bold text-[#0F172A]">{activeCount}</p>
              <p className="mt-1 text-sm text-slate-400">of {agents.length} total</p>
            </div>
            <div className="rounded-lg p-3 bg-emerald-50">
              <Bot className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Actions Today</p>
              <p className="mt-2 text-3xl font-bold text-[#0F172A]">{totalActionsToday}</p>
              <p className="mt-1 text-sm text-slate-400">Automated tasks</p>
            </div>
            <div className="rounded-lg p-3 bg-[#0085FF]/10">
              <Zap className="h-6 w-6 text-[#0085FF]" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">This Week</p>
              <p className="mt-2 text-3xl font-bold text-[#0F172A]">{totalActionsWeek}</p>
              <p className="mt-1 text-sm text-slate-400">Total actions</p>
            </div>
            <div className="rounded-lg p-3 bg-purple-50">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
              <p className="mt-2 text-3xl font-bold text-[#0F172A]">{pendingApprovals}</p>
              <p className="mt-1 text-sm text-slate-400">Need review</p>
            </div>
            <div className="rounded-lg p-3 bg-amber-50">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {agents.map((agent) => {
          const Icon = agentIcons[agent.type];
          const colors = agentColors[agent.type];
          return (
            <div
              key={agent.id}
              className={`rounded-xl border bg-white shadow-sm p-6 ${
                agent.status === "active" ? colors.border : "border-slate-200"
              }`}
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
                      {agent.last_run && ` · Last run ${formatTimeAgo(agent.last_run)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={`rounded-lg p-2 transition-colors ${
                    agent.status === "active"
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {agent.status === "active" ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
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
                <Link
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-1 text-xs text-[#0085FF] hover:text-[#0177E3]"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Configure
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Log */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Agent Activity Log</h2>
        <div className="space-y-3">
          {recentActions.map((action) => {
            const agent = agents.find((a) => a.id === action.agent_id);
            const AgentIcon = agent ? agentIcons[agent.type] : Bot;
            const colors = agent ? agentColors[agent.type] : agentColors.lead_followup;
            return (
              <div
                key={action.id}
                className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className={`rounded-lg p-2 ${colors.bg}`}>
                  <AgentIcon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{action.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-slate-400">{agent?.name}</p>
                    <span className="text-xs text-slate-300">·</span>
                    <p className="text-xs text-slate-400">{formatTimeAgo(action.created_at)}</p>
                  </div>
                </div>
                <div>
                  {action.status === "completed" && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                      <CheckCircle className="h-3 w-3" />
                      Done
                    </span>
                  )}
                  {action.status === "pending_approval" && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                  {action.status === "failed" && (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-500">
                      Failed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
