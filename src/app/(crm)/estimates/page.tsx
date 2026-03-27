"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { demoEstimates } from "@/lib/demo-data";
import { demoCustomers } from "@/lib/demo-data";
import { ESTIMATE_STATUS_CONFIG } from "@/lib/types";
import type { EstimateStatus } from "@/lib/types";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

export default function EstimatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | "">("");
  const [typeFilter, setTypeFilter] = useState("");

  const estimates = demoEstimates
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
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const projectTypes = [
    ...new Set(demoEstimates.map((e) => e.project_type)),
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Estimates</h1>
          <p className="mt-1 text-sm text-slate-500">
            {estimates.length} estimate{estimates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/estimates/new"
          className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]"
        >
          <Plus className="h-4 w-4" />
          New Estimate
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer or project type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as EstimateStatus | "")
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
          >
            <option value="">All Project Types</option>
            {projectTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Project Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {estimates.map((est) => {
              const statusCfg = ESTIMATE_STATUS_CONFIG[est.status];
              return (
                <tr
                  key={est.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/estimates/${est.id}`}
                      className="text-sm font-medium text-slate-700 hover:text-[#0F172A]"
                    >
                      {est.customer_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {est.project_type}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                    {fmt.format(est.total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(est.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {estimates.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No estimates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
