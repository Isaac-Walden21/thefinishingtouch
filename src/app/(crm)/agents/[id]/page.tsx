"use client";

import { use, useState, useEffect } from "react";
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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bell,
  Sun,
  Send,
  BarChart3,
  ChevronDown,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { AgentType, ApprovalMode, AgentChannel, EscalationAction, AIAgent, AgentAction, Customer } from "@/lib/types";

const agentIcons: Record<AgentType, typeof Bot> = {
  lead_followup: UserPlus,
  quote_followup: FileText,
  review_request: Star,
  website_chatbot: MessageCircle,
  job_completion: CheckCircle2,
  appointment_reminder: Bell,
  seasonal_reengagement: Sun,
};

const agentColors: Record<AgentType, { text: string; bg: string }> = {
  lead_followup: { text: "text-[#0085FF]", bg: "bg-[#0085FF]/10" },
  quote_followup: { text: "text-orange-600", bg: "bg-orange-50" },
  review_request: { text: "text-emerald-600", bg: "bg-emerald-50" },
  website_chatbot: { text: "text-purple-600", bg: "bg-purple-50" },
  job_completion: { text: "text-cyan-600", bg: "bg-cyan-50" },
  appointment_reminder: { text: "text-amber-600", bg: "bg-amber-50" },
  seasonal_reengagement: { text: "text-rose-600", bg: "bg-rose-50" },
};

const MERGE_FIELDS = ["{{customer_name}}", "{{first_name}}", "{{project_type}}", "{{quoted_amount}}", "{{company_name}}", "{{review_link}}"];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [allAgents, setAllAgents] = useState<AIAgent[]>([]);
  const [allAgentActions, setAllAgentActions] = useState<AgentAction[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ])
      .then(([agentsData, customersData]) => {
        setAllAgents(agentsData.agents ?? agentsData);
        setAllAgentActions(agentsData.actions ?? []);
        setAllCustomers(customersData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const agent = allAgents.find((a) => a.id === id);

  const [status, setStatus] = useState(agent?.status ?? "paused");
  const [waitHours, setWaitHours] = useState(agent?.config.wait_hours ?? 24);
  const [followUpInterval, setFollowUpInterval] = useState(agent?.config.follow_up_interval_days ?? 3);
  const [maxFollowUps, setMaxFollowUps] = useState(agent?.config.max_follow_ups ?? 3);
  const [escalateDays, setEscalateDays] = useState(agent?.config.escalate_after_days ?? 7);
  const [escalationAction, setEscalationAction] = useState<EscalationAction>(agent?.config.escalation_action ?? "notify_evan");
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>(agent?.config.approval_mode ?? "requires_approval");
  const [channel, setChannel] = useState<AgentChannel>(agent?.config.channel ?? "email");
  const [activeHoursStart, setActiveHoursStart] = useState(agent?.config.active_hours_start ?? "08:00");
  const [activeHoursEnd, setActiveHoursEnd] = useState(agent?.config.active_hours_end ?? "18:00");
  const [activeDays, setActiveDays] = useState<number[]>(agent?.config.active_days ?? [0, 1, 2, 3, 4]);
  const [firstContact, setFirstContact] = useState(agent?.config.templates?.first_contact ?? agent?.config.message_template ?? "");
  const [secondFollowup, setSecondFollowup] = useState(agent?.config.templates?.second_followup ?? "");
  const [finalFollowup, setFinalFollowup] = useState(agent?.config.templates?.final_followup ?? "");
  const [saved, setSaved] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState("evan@thefinishingtouchllc.com");
  const [testCustomerId, setTestCustomerId] = useState(allCustomers[0]?.id ?? "");
  const [activeTemplate, setActiveTemplate] = useState<"first" | "second" | "final">("first");

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-[var(--muted)]">Loading...</div>
    </div>
  );

  if (!agent) {
    return (
      <div className="p-4 pt-16 lg:p-8 lg:pt-8">
        <p className="text-slate-500">Agent not found.</p>
        <Link href="/agents" className="mt-4 text-sm text-[#0085FF] hover:text-[#0177E3]">Back to Agents</Link>
      </div>
    );
  }

  const Icon = agentIcons[agent.type] || Bot;
  const colors = agentColors[agent.type] || agentColors.lead_followup;

  const agentActions = allAgentActions
    .filter((a) => a.agent_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const completedCount = agentActions.filter((a) => a.status === "completed").length;
  const pendingCount = agentActions.filter((a) => a.status === "pending_approval").length;

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const handleSendTest = () => { setShowTestModal(false); };

  const toggleDay = (day: number) => {
    setActiveDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  };

  // Template preview
  const sampleCustomer = allCustomers[0];
  const previewTemplate = (tmpl: string) => {
    return tmpl
      .replace("{{customer_name}}", sampleCustomer?.name ?? "John Doe")
      .replace("{{first_name}}", sampleCustomer?.name?.split(" ")[0] ?? "John")
      .replace("{{project_type}}", sampleCustomer?.service_type ?? "Concrete Patio")
      .replace("{{company_name}}", "The Finishing Touch LLC")
      .replace("{{review_link}}", "https://g.page/thefinishingtouch");
  };

  const currentTemplate = activeTemplate === "first" ? firstContact : activeTemplate === "second" ? secondFollowup : finalFollowup;

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <Link href="/agents" className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Agents
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${colors.bg}`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>{agent.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Send className="h-4 w-4" /> Send Test
          </button>
          <button
            onClick={() => setStatus(status === "active" ? "paused" : "active")}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              status === "active" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {status === "active" ? <><Pause className="h-4 w-4" /> Active</> : <><Play className="h-4 w-4" /> Paused</>}
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Messages Sent</p>
          <p className="text-2xl font-bold text-[#0F172A]">{completedCount}</p>
          <p className="text-xs text-slate-400">this month</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Response Rate</p>
          <p className="text-2xl font-bold text-[#0F172A]">32%</p>
          <p className="text-xs text-emerald-600">+5% vs last month</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Leads Converted</p>
          <p className="text-2xl font-bold text-[#0F172A]">4</p>
          <p className="text-xs text-slate-400">this month</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-[#0F172A]">{pendingCount}</p>
          <p className="text-xs text-amber-600">awaiting approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timing Controls */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Timing Controls</h2>
            <div className="grid grid-cols-2 gap-4">
              {agent.type !== "website_chatbot" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Initial Wait (hours)</label>
                    <input type="number" value={waitHours} onChange={(e) => setWaitHours(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Follow-up Interval (days)</label>
                    <input type="number" value={followUpInterval} onChange={(e) => setFollowUpInterval(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Max Follow-ups</label>
                    <input type="number" value={maxFollowUps} onChange={(e) => setMaxFollowUps(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Escalation Action</label>
                    <select value={escalationAction} onChange={(e) => setEscalationAction(e.target.value as EscalationAction)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none">
                      <option value="do_nothing">Do Nothing</option>
                      <option value="notify_evan">Notify Evan</option>
                      <option value="mark_cold">Mark Lead as Cold</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Active Hours</label>
                <div className="flex items-center gap-2">
                  <input type="time" value={activeHoursStart} onChange={(e) => setActiveHoursStart(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0085FF] focus:outline-none" />
                  <span className="text-xs text-slate-400">to</span>
                  <input type="time" value={activeHoursEnd} onChange={(e) => setActiveHoursEnd(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0085FF] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Active Days</label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => toggleDay(i)}
                      className={clsx(
                        "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                        activeDays.includes(i) ? "bg-[#0085FF] text-white" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mode & Channel */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Mode and Channel</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Approval Mode</label>
                <div className="flex gap-2">
                  {(["auto_send", "requires_approval"] as ApprovalMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setApprovalMode(m)}
                      className={clsx(
                        "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                        approvalMode === m ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]" : "border-slate-200 text-slate-500 hover:border-[#0085FF]/30"
                      )}
                    >
                      {m === "auto_send" ? "Auto-Send" : "Require Approval"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Channel</label>
                <div className="flex gap-2">
                  {(["email", "sms", "both"] as AgentChannel[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setChannel(c)}
                      className={clsx(
                        "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors",
                        channel === c ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]" : "border-slate-200 text-slate-500 hover:border-[#0085FF]/30"
                      )}
                    >
                      {c === "both" ? "Email + SMS" : c.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Message Templates */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Message Templates</h2>

            <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
              {(["first", "second", "final"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTemplate(t)}
                  className={clsx(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTemplate === t ? "bg-white shadow text-[#0085FF]" : "text-slate-500"
                  )}
                >
                  {t === "first" ? "First Contact" : t === "second" ? "Second Follow-up" : "Final Follow-up"}
                </button>
              ))}
            </div>

            <textarea
              value={activeTemplate === "first" ? firstContact : activeTemplate === "second" ? secondFollowup : finalFollowup}
              onChange={(e) => {
                if (activeTemplate === "first") setFirstContact(e.target.value);
                else if (activeTemplate === "second") setSecondFollowup(e.target.value);
                else setFinalFollowup(e.target.value);
              }}
              rows={8}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 font-mono placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none"
            />

            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Merge fields: {MERGE_FIELDS.join(", ")}
              </p>
              <button className="text-xs text-slate-400 hover:text-slate-600">Reset to default</button>
            </div>

            {/* Live Preview */}
            {currentTemplate && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Live Preview:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{previewTemplate(currentTemplate)}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]"
          >
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Performance chart placeholder */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-400" /> Actions (30 days)
            </h3>
            <div className="flex items-end gap-1" style={{ height: 80 }}>
              {Array.from({ length: 30 }, (_, i) => {
                const h = Math.random() * 60 + 10;
                return (
                  <div key={i} className="flex-1 rounded-t-sm bg-[#0085FF]/20 hover:bg-[#0085FF]/40 transition-colors" style={{ height: `${h}%` }} />
                );
              })}
            </div>
          </div>

          {/* Activity history */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Activity History</h3>
            {agentActions.length === 0 ? (
              <p className="text-sm text-slate-500">No actions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {agentActions.slice(0, 10).map((action) => (
                  <div key={action.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm text-slate-700">{action.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {action.status === "completed" && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="h-3 w-3" /> Completed</span>}
                      {action.status === "pending_approval" && <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" /> Pending</span>}
                      {action.status === "failed" && <span className="text-xs text-red-500">Failed</span>}
                      <span className="text-xs text-slate-400">{formatDate(action.created_at)}</span>
                    </div>
                    {action.customer_id && (
                      <Link href={`/customers/${action.customer_id}`} className="mt-1 block text-xs text-[#0085FF] hover:underline">
                        View Customer
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Mode Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">Send Test</h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Recipient</label>
                <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sample Customer</label>
                <select value={testCustomerId} onChange={(e) => setTestCustomerId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none">
                  {allCustomers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <p className="text-xs text-slate-400">This will send the actual template rendered with real customer data. It will not affect customer records.</p>
              <button onClick={handleSendTest} className="w-full rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">
                Send Test Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
