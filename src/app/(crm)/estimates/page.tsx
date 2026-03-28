"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Filter } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import { demoEstimates, demoCustomers } from "@/lib/demo-data";
import { ESTIMATE_STATUS_CONFIG } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import type { EstimateStatus } from "@/lib/types";

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

  const projectTypes = [...new Set(demoEstimates.map((e) => e.project_type))];

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Estimates"
        subtitle={`${estimates.length} estimate${estimates.length !== 1 ? "s" : ""}`}
        action={
          <Button href="/estimates/new">
            <Plus className="h-4 w-4" />
            New Estimate
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by customer or project type..."
          className="flex-1 min-w-[240px]"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EstimateStatus | "")}
            className="!w-auto"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="!w-auto">
            <option value="">All Project Types</option>
            {projectTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-surface shadow-sm overflow-hidden">
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
                <tr key={est.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link href={`/estimates/${est.id}`} className="text-sm font-medium text-slate-700 hover:text-foreground">
                      {est.customer_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{est.project_type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-700">
                    {formatCurrency(est.total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(est.created_at)}
                  </td>
                </tr>
              );
            })}
            {estimates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
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
