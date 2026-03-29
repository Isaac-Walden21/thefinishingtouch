"use client";

import { useState, useEffect } from "react";
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
  Phone,
  MessageSquare,
  Mail,
  AlarmClockOff,
  X,
  RotateCcw,
  Percent,
  TrendingUp,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import ActivityTimeline from "@/components/ActivityTimeline";
import { PageHeader } from "@/components/PageHeader";
import { RevenueGoalTracker } from "@/components/RevenueGoalTracker";
import { TodaySchedule } from "@/components/TodaySchedule";
import { WeatherWidget } from "@/components/WeatherWidget";
import { LEAD_STATUS_CONFIG, PIPELINE_STAGES } from "@/lib/types";
import type { Lead, Activity, Customer, Invoice, AIAgent, AgentAction, CalendarEvent } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/activities').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/calendar/events').then(r => r.json()),
    ])
      .then(([leadsData, activitiesData, customersData, invoicesData, agentsData, eventsData]) => {
        setLeads(leadsData);
        setActivities(activitiesData);
        setCustomers(customersData);
        setInvoices(invoicesData);
        setAgents(agentsData.agents ?? agentsData);
        setAgentActions(agentsData.actions ?? []);
        setCalendarEvents(eventsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-[var(--muted)]">Loading...</div>
    </div>
  );

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  // ── Top row stats ──
  const leadsThisMonth = leads.filter((l) => {
    const d = new Date(l.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const leadsLastMonth = leads.filter((l) => {
    const d = new Date(l.created_at);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });
  const leadChange =
    leadsLastMonth.length > 0
      ? Math.round(
          ((leadsThisMonth.length - leadsLastMonth.length) /
            leadsLastMonth.length) *
            100
        )
      : 100;

  const quotesSent = leads.filter(
    (l) =>
      l.quoted_amount !== null &&
      ["quoted", "booked", "in_progress", "completed"].includes(l.status)
  );

  const jobsBooked = leads.filter((l) =>
    ["booked", "in_progress", "completed"].includes(l.status)
  );

  const completedRevenue = leads
    .filter((l) => l.status === "completed")
    .reduce((sum, l) => sum + (l.quoted_amount ?? 0), 0);

  const outstandingInvoices = invoices
    .filter((inv) =>
      ["sent", "viewed", "partial", "overdue"].includes(inv.status)
    )
    .reduce((sum, inv) => sum + inv.total, 0);

  const closeRate =
    quotesSent.length > 0
      ? Math.round((jobsBooked.length / quotesSent.length) * 100)
      : 0;

  const completedJobs = leads.filter((l) => l.status === "completed");
  const avgJobSize =
    completedJobs.length > 0
      ? Math.round(
          completedJobs.reduce((s, l) => s + (l.quoted_amount ?? 0), 0) /
            completedJobs.length
        )
      : 0;

  // ── Pipeline summary ──
  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.status === stage).length,
    value: leads
      .filter((l) => l.status === stage)
      .reduce((s, l) => s + (l.quoted_amount ?? 0), 0),
    config: LEAD_STATUS_CONFIG[stage],
  }));
  const maxPipelineCount = Math.max(...pipelineCounts.map((p) => p.count), 1);

  // ── Agent summary ──
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const agentActionsToday = agents.reduce(
    (sum, a) => sum + a.actions_today,
    0
  );
  const pendingApprovals = agentActions.filter(
    (a) => a.status === "pending_approval"
  ).length;

  // ── Activity feed ──
  const recentActivities = [...activities]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  // ── Today's events ──
  const today = new Date();
  const todayEvents = calendarEvents.filter((e) => {
    const d = new Date(e.start_time);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  // ── Follow-ups ──
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const followUps = [
    ...leads
      .filter((l) => l.status === "new")
      .map((l) => ({
        id: l.id,
        label: `Follow up with ${customerMap.get(l.customer_id)?.name ?? "Unknown"}`,
        detail: l.project_type ?? "New lead",
        type: "lead" as const,
        phone: customerMap.get(l.customer_id)?.phone ?? null,
        email: customerMap.get(l.customer_id)?.email ?? null,
        color: "text-brand",
        bgColor: "bg-brand/10",
      })),
    ...leads
      .filter((l) => l.status === "quoted")
      .map((l) => ({
        id: l.id,
        label: `Check on quote for ${customerMap.get(l.customer_id)?.name ?? "Unknown"}`,
        detail: formatCurrency(l.quoted_amount ?? 0) ?? "$0",
        type: "quote" as const,
        phone: customerMap.get(l.customer_id)?.phone ?? null,
        email: customerMap.get(l.customer_id)?.email ?? null,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      })),
    ...agentActions
      .filter((a) => a.status === "pending_approval")
      .map((a) => ({
        id: a.id,
        label: "Review agent action",
        detail: a.description,
        type: "agent" as const,
        phone: null,
        email: null,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      })),
    ...invoices
      .filter((inv) => inv.status === "overdue")
      .map((inv) => ({
        id: inv.id,
        label: `Overdue invoice ${inv.invoice_number}`,
        detail: formatCurrency(inv.total) ?? "$0",
        type: "invoice" as const,
        phone: customerMap.get(inv.customer_id)?.phone ?? null,
        email: customerMap.get(inv.customer_id)?.email ?? null,
        color: "text-red-500",
        bgColor: "bg-red-50",
      })),
  ].filter((item) => !dismissedIds.has(item.id));

  function dismiss(id: string) {
    setDismissedIds((prev) => new Set([...prev, id]));
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Mike. Here's your command center."
        actions={
          <Link
            href="/customers/new"
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition-colors hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        }
      />

      {/* TOP ROW -- 7 Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <StatsCard
          title="Leads"
          value={leadsThisMonth.length}
          icon={GitPullRequestArrow}
          color="blue"
          trend={{ value: `${leadChange}%`, positive: leadChange >= 0 }}
        />
        <StatsCard
          title="Quotes Sent"
          value={quotesSent.length}
          subtitle="Active"
          icon={FileText}
          color="orange"
        />
        <StatsCard
          title="Jobs Booked"
          value={jobsBooked.length}
          icon={CalendarCheck}
          color="emerald"
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(completedRevenue) ?? "$0"}
          subtitle="This month"
          icon={DollarSign}
          color="purple"
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(outstandingInvoices) ?? "$0"}
          subtitle="Unpaid"
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Close Rate"
          value={`${closeRate}%`}
          subtitle="Quotes to booked"
          icon={Percent}
          color="emerald"
        />
        <StatsCard
          title="Avg Job Size"
          value={formatCurrency(avgJobSize) ?? "$0"}
          subtitle="Per completed"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* SECOND ROW -- Revenue Goal + Today's Schedule */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueGoalTracker
          actual={completedRevenue}
          target={50000}
          projected={completedRevenue * 1.4}
        />
        <TodaySchedule events={todayEvents} />
      </div>

      {/* THIRD ROW -- Follow-ups + Weather */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Actionable Follow-ups
          </h2>
          <div className="space-y-3">
            {followUps.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className={`shrink-0 rounded-lg p-2 ${item.bgColor}`}>
                  {item.type === "lead" && (
                    <Users className={`h-4 w-4 ${item.color}`} />
                  )}
                  {item.type === "quote" && (
                    <FileText className={`h-4 w-4 ${item.color}`} />
                  )}
                  {item.type === "agent" && (
                    <Bot className={`h-4 w-4 ${item.color}`} />
                  )}
                  {item.type === "invoice" && (
                    <DollarSign className={`h-4 w-4 ${item.color}`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {item.detail}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.phone && (
                    <>
                      <a
                        href={`tel:${item.phone}`}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-brand/30 hover:text-brand transition-colors"
                        title="Call"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`sms:${item.phone}`}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-brand/30 hover:text-brand transition-colors"
                        title="Text"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </a>
                    </>
                  )}
                  {item.type === "quote" && (
                    <button
                      className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-brand/30 hover:text-brand transition-colors"
                      title="Resend Quote"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {item.type === "invoice" && (
                    <button
                      className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-brand/30 hover:text-brand transition-colors"
                      title="Resend Invoice"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-amber-200 hover:text-amber-500 transition-colors"
                    title="Snooze"
                  >
                    <AlarmClockOff className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => dismiss(item.id)}
                    className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-red-200 hover:text-red-400 transition-colors"
                    title="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {followUps.length === 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-sm text-slate-700">
                  No pending follow-ups. You&apos;re all caught up!
                </p>
              </div>
            )}
          </div>
        </div>
        <WeatherWidget />
      </div>

      {/* FOURTH ROW -- Pipeline + Agent Activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Pipeline Summary
            </h2>
            <Link
              href="/leads"
              className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
            >
              View pipeline
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {pipelineCounts.map(({ stage, count, value, config }) => (
              <Link
                key={stage}
                href={`/leads?status=${stage}`}
                className="group flex items-center gap-3"
              >
                <div className="w-24">
                  <span
                    className={`text-xs font-medium ${config.color} group-hover:underline`}
                  >
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
                    <span
                      className={`px-2 text-xs font-bold ${config.color}`}
                    >
                      {count}
                    </span>
                  </div>
                </div>
                {value > 0 && (
                  <span className="w-20 text-right text-xs text-slate-500">
                    {formatCurrency(value)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* AI Agent Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              AI Agent Activity
            </h2>
            <Link
              href="/agents"
              className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
            >
              Manage agents
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {activeAgents}
              </p>
              <p className="mt-1 text-xs text-slate-500">Active Agents</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {agentActionsToday}
              </p>
              <p className="mt-1 text-xs text-slate-500">Actions Today</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center">
              <p
                className={`text-2xl font-bold ${pendingApprovals > 0 ? "text-amber-600" : "text-foreground"}`}
              >
                {pendingApprovals}
              </p>
              <p className="mt-1 text-xs text-slate-500">Pending</p>
            </div>
          </div>
          <div className="space-y-2">
            {agentActions
              .filter((a) => a.status === "pending_approval")
              .slice(0, 3)
              .map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs text-slate-700 truncate">
                      {action.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-600 transition-colors">
                      Approve
                    </button>
                    <button className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            {pendingApprovals === 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-xs text-slate-700">
                  All agent actions are up to date
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FIFTH ROW -- Activity Timeline */}
      <div className="mt-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
          <ActivityTimeline activities={recentActivities} />
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick Actions
          </span>
          <div className="h-4 w-px bg-slate-200" />
          {[
            { href: "/customers/new", icon: Plus, label: "Add New Lead" },
            {
              href: "/estimates/new",
              icon: Calculator,
              label: "Create Estimate",
            },
            { href: "/invoices/new", icon: Send, label: "Send Invoice" },
            { href: "/vision", icon: Camera, label: "Open Vision Studio" },
            { href: "/agents", icon: Bot, label: "View Agent Queue" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-brand/30 hover:text-brand"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
