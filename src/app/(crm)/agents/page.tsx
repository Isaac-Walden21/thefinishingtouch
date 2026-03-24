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
  ArrowRight,
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
  lead_followup: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  quote_followup: { text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" },
  review_request: { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  website_chatbot: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
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
          <h1 className="text-2xl font-bold text-white">AI Agents</h1>
          <p className="mt-1 text-sm text-slate-400">
            Automated assistants that handle follow-ups, reviews, and customer engagement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingApprovals > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-2.5 text-sm font-medium text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              {pendingApprovals} pending approval{pendingApprovals > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Active Agents</p>
              <p className="mt-2 text-3xl font-bold text-white">{activeCount}</p>
              <p className="mt-1 text-sm text-slate-500">of {agents.length} total</p>
            </div>
            <div className="rounded-lg p-3 bg-emerald-500/20">
              <Bot className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Actions Today</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalActionsToday}</p>
              <p className="mt-1 text-sm text-slate-500">Automated tasks</p>
            </div>
            <div className="rounded-lg p-3 bg-blue-500/20">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">This Week</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalActionsWeek}</p>
              <p className="mt-1 text-sm text-slate-500">Total actions</p>
            </div>
            <div className="rounded-lg p-3 bg-purple-500/20">
              <Clock className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Pending Approvals</p>
              <p className="mt-2 text-3xl font-bold text-white">{pendingApprovals}</p>
              <p className="mt-1 text-sm text-slate-500">Need review</p>
            </div>
            <div className="rounded-lg p-3 bg-yellow-500/20">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
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
              className={`rounded-xl border bg-[#111a2e] p-6 ${
                agent.status === "active" ? colors.border : "border-slate-700/50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${colors.bg}`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {agent.status === "active" ? (
                        <span className="text-emerald-400">Active</span>
                      ) : (
                        <span className="text-slate-500">Paused</span>
                      )}
                      {agent.last_run && ` · Last run ${formatTimeAgo(agent.last_run)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={`rounded-lg p-2 transition-colors ${
                    agent.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {agent.status === "active" ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-4">{agent.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{agent.actions_today} today</span>
                  <span>{agent.actions_this_week} this week</span>
                  <span className="capitalize">
                    {agent.config.approval_mode === "auto_send" ? "Auto-send" : "Approval required"}
                  </span>
                </div>
                <Link
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
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
      <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Agent Activity Log</h2>
        <div className="space-y-3">
          {recentActions.map((action) => {
            const agent = agents.find((a) => a.id === action.agent_id);
            const AgentIcon = agent ? agentIcons[agent.type] : Bot;
            const colors = agent ? agentColors[agent.type] : agentColors.lead_followup;
            return (
              <div
                key={action.id}
                className="flex items-start gap-4 rounded-lg border border-slate-700/50 bg-[#0d1526] p-4"
              >
                <div className={`rounded-lg p-2 ${colors.bg}`}>
                  <AgentIcon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{action.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-slate-500">{agent?.name}</p>
                    <span className="text-xs text-slate-600">·</span>
                    <p className="text-xs text-slate-500">{formatTimeAgo(action.created_at)}</p>
                  </div>
                </div>
                <div>
                  {action.status === "completed" && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      Done
                    </span>
                  )}
                  {action.status === "pending_approval" && (
                    <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                      <AlertTriangle className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                  {action.status === "failed" && (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
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
