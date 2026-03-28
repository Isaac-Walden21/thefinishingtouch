import Link from "next/link";
import {
  GitPullRequestArrow,
  FileText,
  CalendarCheck,
  DollarSign,
  Plus,
  Users,
  ArrowRight,
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  Camera,
  Calculator,
  Send,
  HardHat,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import ActivityTimeline from "@/components/ActivityTimeline";
import {
  demoLeads,
  demoActivities,
  demoCustomers,
  demoInvoices,
  demoAgents,
  demoAgentActions,
} from "@/lib/demo-data";
import { LEAD_STATUS_CONFIG, PIPELINE_STAGES } from "@/lib/types";

export default function DashboardPage() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  // ── Top row stats ──
  const leadsThisMonth = demoLeads.filter((l) => {
    const d = new Date(l.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const leadsLastMonth = demoLeads.filter((l) => {
    const d = new Date(l.created_at);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });
  const leadChange =
    leadsLastMonth.length > 0
      ? Math.round(
          ((leadsThisMonth.length - leadsLastMonth.length) / leadsLastMonth.length) * 100
        )
      : 100;

  const quotesSent = demoLeads.filter(
    (l) =>
      l.quoted_amount !== null &&
      ["quoted", "booked", "in_progress", "completed"].includes(l.status)
  );

  const jobsBooked = demoLeads.filter((l) =>
    ["booked", "in_progress", "completed"].includes(l.status)
  );

  const completedRevenue = demoLeads
    .filter((l) => l.status === "completed")
    .reduce((sum, l) => sum + (l.quoted_amount ?? 0), 0);

  const outstandingInvoices = demoInvoices
    .filter((inv) => ["sent", "viewed", "partial", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total, 0);

  // ── Pipeline summary ──
  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: demoLeads.filter((l) => l.status === stage).length,
    config: LEAD_STATUS_CONFIG[stage],
  }));
  const maxPipelineCount = Math.max(...pipelineCounts.map((p) => p.count), 1);

  // ── Agent summary ──
  const activeAgents = demoAgents.filter((a) => a.status === "active").length;
  const agentActionsToday = demoAgents.reduce((sum, a) => sum + a.actions_today, 0);
  const pendingApprovals = demoAgentActions.filter(
    (a) => a.status === "pending_approval"
  ).length;

  // ── Activity feed ──
  const recentActivities = [...demoActivities]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  // ── Follow-ups & tasks ──
  const customerMap = new Map(demoCustomers.map((c) => [c.id, c]));
  const followUps = [
    ...demoLeads
      .filter((l) => l.status === "new")
      .map((l) => ({
        id: l.id,
        label: `Follow up with ${customerMap.get(l.customer_id)?.name ?? "Unknown"}`,
        detail: l.project_type ?? "New lead",
        type: "lead" as const,
        color: "text-[#0085FF]",
        bgColor: "bg-[#0085FF]/10",
      })),
    ...demoLeads
      .filter((l) => l.status === "quoted")
      .map((l) => ({
        id: l.id,
        label: `Check on quote for ${customerMap.get(l.customer_id)?.name ?? "Unknown"}`,
        detail: `$${l.quoted_amount?.toLocaleString() ?? 0}`,
        type: "quote" as const,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      })),
    ...demoAgentActions
      .filter((a) => a.status === "pending_approval")
      .map((a) => ({
        id: a.id,
        label: "Review agent action",
        detail: a.description,
        type: "agent" as const,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      })),
  ].slice(0, 6);

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, Mike. Here&apos;s your command center.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/estimates/job-walk"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/20 transition-colors hover:from-amber-600 hover:to-amber-700"
          >
            <HardHat className="h-4 w-4" />
            New Job Walk
          </Link>
          <Link
            href="/customers/new"
            className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#0085FF]/20 transition-colors hover:bg-[#0177E3]"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      </div>

      {/* TOP ROW — Key Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Leads This Month"
          value={leadsThisMonth.length}
          icon={GitPullRequestArrow}
          color="blue"
          trend={{
            value: `${leadChange}%`,
            positive: leadChange >= 0,
          }}
        />
        <StatsCard
          title="Quotes Sent"
          value={quotesSent.length}
          subtitle="Active quotes"
          icon={FileText}
          color="orange"
        />
        <StatsCard
          title="Jobs Booked"
          value={jobsBooked.length}
          subtitle="Booked + in progress"
          icon={CalendarCheck}
          color="emerald"
        />
        <StatsCard
          title="Completed Revenue"
          value={`$${completedRevenue.toLocaleString()}`}
          subtitle="This month"
          icon={DollarSign}
          color="purple"
        />
        <StatsCard
          title="Outstanding"
          value={`$${outstandingInvoices.toLocaleString()}`}
          subtitle="Unpaid invoices"
          icon={Clock}
          color="orange"
        />
      </div>

      {/* MIDDLE ROW — Pipeline + Agent Summary */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Pipeline Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#0F172A]">Pipeline Summary</h2>
            <Link
              href="/leads"
              className="flex items-center gap-1 text-sm font-medium text-[#0085FF] hover:text-[#0177E3]"
            >
              View pipeline
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {pipelineCounts.map(({ stage, count, config }) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-24">
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${config.bgColor} flex items-center transition-all`}
                    style={{
                      width: `${(count / maxPipelineCount) * 100}%`,
                      minWidth: count > 0 ? "2rem" : "0",
                    }}
                  >
                    <span className={`px-2 text-xs font-bold ${config.color}`}>
                      {count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Agent Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#0F172A]">
              AI Agent Activity
            </h2>
            <Link
              href="/agents"
              className="flex items-center gap-1 text-sm font-medium text-[#0085FF] hover:text-[#0177E3]"
            >
              Manage agents
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-center">
              <p className="text-2xl font-bold text-[#0F172A]">{activeAgents}</p>
              <p className="text-xs text-slate-500 mt-1">Active Agents</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-center">
              <p className="text-2xl font-bold text-[#0F172A]">{agentActionsToday}</p>
              <p className="text-xs text-slate-500 mt-1">Actions Today</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-center">
              <p className={`text-2xl font-bold ${pendingApprovals > 0 ? "text-amber-600" : "text-[#0F172A]"}`}>
                {pendingApprovals}
              </p>
              <p className="text-xs text-slate-500 mt-1">Pending Approvals</p>
            </div>
          </div>
          <div className="space-y-2">
            {demoAgentActions
              .filter((a) => a.status === "pending_approval")
              .slice(0, 3)
              .map((action) => (
                <div
                  key={action.id}
                  className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-slate-700 truncate">
                    {action.description}
                  </p>
                </div>
              ))}
            {pendingApprovals === 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-xs text-slate-700">
                  All agent actions are up to date
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — Activity + Follow-ups */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-[#0F172A]">
            Recent Activity
          </h2>
          <ActivityTimeline activities={recentActivities} />
        </div>

        {/* Follow-ups & Tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-[#0F172A]">
            Follow-ups &amp; Tasks
          </h2>
          <div className="space-y-3">
            {followUps.map((item) => (
              <Link
                key={item.id}
                href={
                  item.type === "agent"
                    ? "/agents"
                    : `/leads/${item.id}`
                }
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:border-[#0085FF]/30 hover:shadow-sm"
              >
                <div className={`rounded-lg p-2 ${item.bgColor}`}>
                  {item.type === "lead" && (
                    <Users className={`h-4 w-4 ${item.color}`} />
                  )}
                  {item.type === "quote" && (
                    <FileText className={`h-4 w-4 ${item.color}`} />
                  )}
                  {item.type === "agent" && (
                    <Bot className={`h-4 w-4 ${item.color}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.detail}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
            {followUps.length === 0 && (
              <div className="py-4 text-center text-sm text-slate-500">
                No pending follow-ups. You&apos;re all caught up!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Quick Actions
          </span>
          <div className="h-4 w-px bg-slate-200" />
          <Link
            href="/estimates/job-walk"
            className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors shrink-0"
          >
            <HardHat className="h-3.5 w-3.5" />
            New Job Walk
          </Link>
          <Link
            href="/customers/new"
            className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-[#0085FF]/30 hover:text-[#0085FF] transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Lead
          </Link>
          <Link
            href="/estimates/new"
            className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-[#0085FF]/30 hover:text-[#0085FF] transition-colors shrink-0"
          >
            <Calculator className="h-3.5 w-3.5" />
            Create Estimate
          </Link>
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-[#0085FF]/30 hover:text-[#0085FF] transition-colors shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            Send Invoice
          </Link>
          <Link
            href="/vision"
            className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-[#0085FF]/30 hover:text-[#0085FF] transition-colors shrink-0"
          >
            <Camera className="h-3.5 w-3.5" />
            Open Vision Studio
          </Link>
          <Link
            href="/agents"
            className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-[#0085FF]/30 hover:text-[#0085FF] transition-colors shrink-0"
          >
            <Bot className="h-3.5 w-3.5" />
            View Agent Queue
          </Link>
        </div>
      </div>
    </div>
  );
}
