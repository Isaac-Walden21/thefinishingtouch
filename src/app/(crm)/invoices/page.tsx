"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Filter, DollarSign, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
import { demoInvoices, demoCustomers, demoPayments } from "@/lib/demo-data";
import { INVOICE_STATUS_CONFIG } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceStatus } from "@/lib/types";

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
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
        action={
          <Button href="/invoices/new">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Outstanding</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Paid This Month</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalPaidThisMonth)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Overdue</p>
              <p className="text-lg font-bold text-foreground">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by customer or invoice number..."
          className="flex-1 min-w-[240px]"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "")}
            className="!w-auto"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-surface shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Sent</th>
              <th className="px-6 py-4">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const statusCfg = INVOICE_STATUS_CONFIG[inv.status];
              return (
                <tr key={inv.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-brand hover:text-brand-hover">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{inv.customer?.name ?? "Unknown"}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-700">{formatCurrency(inv.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {inv.sent_at ? formatDate(inv.sent_at) : "\u2014"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(inv.due_date)}</td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
