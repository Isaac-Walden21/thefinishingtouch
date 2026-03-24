"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Filter, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { demoInvoices, demoCustomers, demoPayments } from "@/lib/demo-data";
import { INVOICE_STATUS_CONFIG } from "@/lib/types";
import type { InvoiceStatus } from "@/lib/types";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");

  const invoices = useMemo(() => {
    return demoInvoices
      .map((inv) => ({
        ...inv,
        customer: demoCustomers.find((c) => c.id === inv.customer_id),
      }))
      .filter((inv) => {
        const customerName = inv.customer?.name ?? "";
        const matchesSearch =
          !search ||
          customerName.toLowerCase().includes(search.toLowerCase()) ||
          inv.invoice_number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [search, statusFilter]);

  const totalOutstanding = demoInvoices
    .filter((i) => ["sent", "viewed", "partial", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + i.total, 0);

  const totalPaidThisMonth = demoPayments
    .filter((p) => {
      const d = new Date(p.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueCount = demoInvoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="mt-1 text-sm text-slate-400">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
              <DollarSign className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Outstanding</p>
              <p className="text-lg font-bold text-white">{fmt.format(totalOutstanding)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Paid This Month</p>
              <p className="text-lg font-bold text-white">{fmt.format(totalPaidThisMonth)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Overdue</p>
              <p className="text-lg font-bold text-white">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700/50 bg-[#0d1526] pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as InvoiceStatus | "")
            }
            className="rounded-lg border border-slate-700/50 bg-[#0d1526] px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Sent</th>
              <th className="px-6 py-4">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {invoices.map((inv) => {
              const statusCfg = INVOICE_STATUS_CONFIG[inv.status];
              return (
                <tr
                  key={inv.id}
                  className="transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-200">
                    {inv.customer?.name ?? "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-200">
                    {fmt.format(inv.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {inv.sent_at
                      ? new Date(inv.sent_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(inv.due_date).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
