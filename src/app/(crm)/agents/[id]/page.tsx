"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  UserPlus,
  FileText,
  Star,
  MessageCircle,
  Play,
  Pause,
  Save,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { demoAgents, demoAgentActions } from "@/lib/demo-data";
import type { AgentType, ApprovalMode } from "@/lib/types";

const agentIcons: Record<AgentType, typeof Bot> = {
  lead_followup: UserPlus,
  quote_followup: FileText,
  review_request: Star,
  website_chatbot: MessageCircle,
};

const agentColors: Record<AgentType, { text: string; bg: string }> = {
  lead_followup: { text: "text-[#0085FF]", bg: "bg-[#0085FF]/10" },
  quote_followup: { text: "text-orange-600", bg: "bg-orange-50" },
  review_request: { text: "text-emerald-600", bg: "bg-emerald-50" },
  website_chatbot: { text: "text-purple-600", bg: "bg-purple-50" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const agent = demoAgents.find((a) => a.id === id);

  const [status, setStatus] = useState(agent?.status ?? "paused");
  const [waitHours, setWaitHours] = useState(agent?.config.wait_hours ?? 24);
  const [escalateDays, setEscalateDays] = useState(agent?.config.escalate_after_days ?? 7);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>(
    agent?.config.approval_mode ?? "requires_approval"
  );
  const [template, setTemplate] = useState(agent?.config.message_template ?? "");
  const [saved, setSaved] = useState(false);

  if (!agent) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Agent not found.</p>
        <Link href="/agents" className="mt-4 text-sm text-[#0085FF] hover:text-[#0177E3]">
          Back to Agents
        </Link>
      </div>
    );
  }

  const Icon = agentIcons[agent.type];
  const colors = agentColors[agent.type];

  const agentActions = demoAgentActions
    .filter((a) => a.agent_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/agents"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-lg p-3 ${colors.bg}`}>
              <Icon className={`h-6 w-6 ${colors.text}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">{agent.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{agent.description}</p>
            </div>
          </div>
          <button
            onClick={() => setStatus(status === "active" ? "paused" : "active")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              status === "active"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {status === "active" ? (
              <>
                <Pause className="h-4 w-4" /> Active
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Paused
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Agent Settings</h2>
            <div className="space-y-5">
              {agent.type !== "website_chatbot" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Wait Time Before Triggering (hours)
                    </label>
                    <input
                      type="number"
                      value={waitHours}
                      onChange={(e) => setWaitHours(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Escalate After (days)
                    </label>
                    <input
                      type="number"
                      value={escalateDays}
                      onChange={(e) => setEscalateDays(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Approval Mode
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setApprovalMode("auto_send")}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      approvalMode === "auto_send"
                        ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-[#0085FF]/30"
                    }`}
                  >
                    Auto-Send
                  </button>
                  <button
                    onClick={() => setApprovalMode("requires_approval")}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      approvalMode === "requires_approval"
                        ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-[#0085FF]/30"
                    }`}
                  >
                    Require Approval
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Message Template</h2>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF] font-mono"
            />
            <p className="mt-2 text-xs text-slate-400">
              Available merge fields: {"{{first_name}}"}, {"{{project_type}}"}, {"{{company}}"}
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]"
          >
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

        {/* Activity history */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Activity History</h2>
            {agentActions.length === 0 ? (
              <p className="text-sm text-slate-500">No actions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {agentActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="text-sm text-slate-700">{action.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {action.status === "completed" && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </span>
                      )}
                      {action.status === "pending_approval" && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatDate(action.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
