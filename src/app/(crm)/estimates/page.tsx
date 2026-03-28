"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Send,
  Copy,
  FileText,
  DollarSign,
  TrendingUp,
  BarChart3,
  Download,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import StatsCard from "@/components/StatsCard";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { demoEstimates, demoCustomers } from "@/lib/demo-data";
import {
  ESTIMATE_STATUS_CONFIG,
  type EstimateStatus,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

const EXPIRATION_DAYS = 30;

function getExpirationInfo(createdAt: string): {
  label: string;
  color: string;
  bgColor: string;
  expired: boolean;
} {
  const created = new Date(createdAt);
  const expires = new Date(created.getTime() + EXPIRATION_DAYS * 86400000);
  const daysLeft = Math.ceil(
    (expires.getTime() - Date.now()) / 86400000
  );

  if (daysLeft < 0) return { label: "Expired", color: "text-red-500", bgColor: "bg-red-50", expired: true };
  if (daysLeft <= 3)
    return {
      label: `Expires in ${daysLeft}d`,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      expired: false,
    };
  return {
    label: `Expires in ${daysLeft}d`,
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    expired: false,
  };
}

export default function EstimatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | "">("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const estimates = useMemo(() => {
    return demoEstimates
      .map((est) => ({
        ...est,
        customer: demoCustomers.find((c) => c.id === est.customer_id),
      }))
      .filter((est) => {
        const matchesSearch =
          !search ||
          est.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          est.project_type.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || est.status === statusFilter;
        const matchesType = !typeFilter || est.project_type === typeFilter;
        if (dateRange) {
          const d = new Date(est.created_at);
          const now = new Date();
          if (dateRange === "month" && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
          if (dateRange === "30d") {
            const ago = new Date(now.getTime() - 30 * 86400000);
            if (d < ago) return false;
          }
          if (dateRange === "90d") {
            const ago = new Date(now.getTime() - 90 * 86400000);
            if (d < ago) return false;
          }
        }
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [search, statusFilter, typeFilter, dateRange]);

  const projectTypes = [...new Set(demoEstimates.map((e) => e.project_type))];

  // Stats
  const now = new Date();
  const thisMonthEstimates = demoEstimates.filter((e) => {
    const d = new Date(e.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const sentCount = demoEstimates.filter((e) =>
    ["sent", "accepted", "declined"].includes(e.status)
  ).length;
  const acceptedCount = demoEstimates.filter(
    (e) => e.status === "accepted"
  ).length;
  const acceptanceRate = sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0;
  const activeQuotedValue = demoEstimates
    .filter((e) => !["declined"].includes(e.status))
    .reduce((s, e) => s + e.total, 0);
  const avgSize =
    thisMonthEstimates.length > 0
      ? Math.round(
          thisMonthEstimates.reduce((s, e) => s + e.total, 0) /
            thisMonthEstimates.length
        )
      : 0;

  const paged = estimates.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Estimates"
        subtitle={`${estimates.length} estimate${estimates.length !== 1 ? "s" : ""}`}
        actions={
          <Link
            href="/estimates/new"
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" />
            New Estimate
          </Link>
        }
      />

      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="This Month"
          value={thisMonthEstimates.length}
          subtitle="Estimates created"
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Acceptance Rate"
          value={`${acceptanceRate}%`}
          subtitle="Accepted / sent"
          icon={TrendingUp}
          color="emerald"
        />
        <StatsCard
          title="Total Quoted"
          value={formatCurrency(activeQuotedValue) ?? "$0"}
          subtitle="Active estimates"
          icon={DollarSign}
          color="purple"
        />
        <StatsCard
          title="Avg Estimate"
          value={formatCurrency(avgSize) ?? "$0"}
          subtitle="This month"
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer or project type..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as EstimateStatus | "");
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="">All Project Types</option>
            {projectTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="">All Dates</option>
            <option value="month">This Month</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" />
              Download PDFs
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selectedIds.size === paged.length}
                    onChange={() => {
                      if (selectedIds.size === paged.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(paged.map((e) => e.id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                </th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Project Type</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Amount</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Expires</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((est) => {
                const statusCfg = ESTIMATE_STATUS_CONFIG[est.status];
                const expInfo = getExpirationInfo(est.created_at);

                return (
                  <tr
                    key={est.id}
                    className={clsx(
                      "transition-colors hover:bg-slate-50",
                      selectedIds.has(est.id) && "bg-brand/5"
                    )}
                  >
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(est.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(est.id)) next.delete(est.id);
                          else next.add(est.id);
                          setSelectedIds(next);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/estimates/${est.id}`}
                        className="text-sm font-medium text-brand hover:text-brand-hover"
                      >
                        {est.customer_name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {est.project_type}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={est.status}
                        onChange={() => {
                          // Would trigger API call
                        }}
                        className={clsx(
                          "rounded-full border-0 px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand",
                          statusCfg.color,
                          statusCfg.bgColor
                        )}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-700">
                      {formatCurrency(est.total)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatDate(est.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        label={expInfo.label}
                        color={expInfo.color}
                        bgColor={expInfo.bgColor}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {["draft", "sent"].includes(est.status) && (
                          <button
                            className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-brand/30 hover:text-brand transition-colors"
                            title="Send"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {est.status === "accepted" && (
                          <Link
                            href={`/invoices/new?estimate=${est.id}`}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors"
                            title="Convert to Invoice"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <button
                          className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:border-brand/30 hover:text-brand transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No estimates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          total={estimates.length}
          page={page}
          pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </div>
    </div>
  );
}
