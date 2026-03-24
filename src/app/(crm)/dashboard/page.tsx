import Link from "next/link";
import {
  GitPullRequestArrow,
  FileText,
  CalendarCheck,
  DollarSign,
  Plus,
  Users,
  ArrowRight,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import ActivityTimeline from "@/components/ActivityTimeline";
import { demoLeads, demoActivities, demoCustomers } from "@/lib/demo-data";
import { LEAD_STATUS_CONFIG } from "@/lib/types";

export default function DashboardPage() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const leadsThisMonth = demoLeads.filter((l) => {
    const d = new Date(l.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

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

  const recentActivities = [...demoActivities]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 8);

  const recentLeads = [...demoLeads]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const customerMap = new Map(demoCustomers.map((c) => [c.id, c]));

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back, Mike. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/customers/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Leads This Month"
          value={leadsThisMonth.length}
          subtitle="March 2026"
          icon={GitPullRequestArrow}
          color="blue"
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
          subtitle="From completed jobs"
          icon={DollarSign}
          color="purple"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Recent Leads
              </h2>
              <Link
                href="/leads"
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
              >
                View pipeline
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentLeads.map((lead) => {
                const customer = customerMap.get(lead.customer_id);
                const config = LEAD_STATUS_CONFIG[lead.status];
                return (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-[#0d1526] p-4 transition-colors hover:border-slate-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50">
                        <Users className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {lead.project_type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {customer?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {lead.quoted_amount && (
                        <span className="text-sm font-medium text-slate-300">
                          $
                          {lead.quoted_amount.toLocaleString()}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}
                      >
                        {config.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <ActivityTimeline activities={recentActivities} />
          </div>
        </div>
      </div>
    </div>
  );
}
