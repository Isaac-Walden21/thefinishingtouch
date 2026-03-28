"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingUp,
  Copy,
  Bell,
  CheckCircle2,
  Download,
  Send,
  X,
} from "lucide-react";
import { demoInvoices, demoCustomers, demoPayments } from "@/lib/demo-data";
import { INVOICE_STATUS_CONFIG } from "@/lib/types";
import type { InvoiceStatus, PaymentMethod } from "@/lib/types";
import StatsCard from "@/components/StatsCard";
import RevenueChart from "@/components/RevenueChart";
import AgingReport from "@/components/AgingReport";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

type DateRange = "this_month" | "last_30" | "last_90" | "this_year" | "all";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [agingBucket, setAgingBucket] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMarkPaid, setShowMarkPaid] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [checkNumber, setCheckNumber] = useState("");
  const [reminderSent, setReminderSent] = useState<Set<string>>(new Set());
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const invoices = useMemo(() => {
    const now = new Date();
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

        // Date range
        let matchesDate = true;
        if (dateRange !== "all") {
          const d = new Date(inv.created_at);
          if (dateRange === "this_month") {
            matchesDate = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          } else if (dateRange === "last_30") {
            matchesDate = now.getTime() - d.getTime() <= 30 * 24 * 60 * 60 * 1000;
          } else if (dateRange === "last_90") {
            matchesDate = now.getTime() - d.getTime() <= 90 * 24 * 60 * 60 * 1000;
          } else if (dateRange === "this_year") {
            matchesDate = d.getFullYear() === now.getFullYear();
          }
        }

        // Aging bucket filter
        let matchesBucket = true;
        if (agingBucket && ["sent", "viewed", "partial", "overdue"].includes(inv.status)) {
          const sentDate = inv.sent_at ? new Date(inv.sent_at) : new Date(inv.created_at);
          const daysSince = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (agingBucket === "current") matchesBucket = daysSince <= 30;
          else if (agingBucket === "31-60") matchesBucket = daysSince > 30 && daysSince <= 60;
          else if (agingBucket === "61-90") matchesBucket = daysSince > 60 && daysSince <= 90;
          else if (agingBucket === "90+") matchesBucket = daysSince > 90;
        } else if (agingBucket) {
          matchesBucket = false;
        }

        return matchesSearch && matchesStatus && matchesDate && matchesBucket;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [search, statusFilter, dateRange, agingBucket]);

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

  const overdueInvoices = demoInvoices.filter((i) => i.status === "overdue");
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.total, 0);

  const paidInvoices = demoInvoices.filter((i) => i.status === "paid" && i.sent_at && i.paid_at);
  const avgDaysToPay =
    paidInvoices.length > 0
      ? Math.round(
          paidInvoices.reduce((sum, i) => {
            return sum + (new Date(i.paid_at!).getTime() - new Date(i.sent_at!).getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / paidInvoices.length
        )
      : 0;

  const selectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCopyLink = (invoiceId: string) => {
    const link = `${window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(invoiceId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleRemind = (id: string) => {
    setReminderSent((prev) => new Set(prev).add(id));
  };

  const handleMarkPaid = (id: string) => {
    setShowMarkPaid(null);
    // In production: API call
  };

  const activeFilters: string[] = [];
  if (statusFilter) activeFilters.push(INVOICE_STATUS_CONFIG[statusFilter].label);
  if (dateRange !== "all") activeFilters.push(dateRange.replace("_", " "));
  if (agingBucket) activeFilters.push(`Aging: ${agingBucket}`);

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>
            Invoices
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Outstanding" value={fmt.format(totalOutstanding)} icon={DollarSign} color="orange" />
        <StatsCard title="Paid This Month" value={fmt.format(totalPaidThisMonth)} icon={TrendingUp} color="emerald" />
        <StatsCard
          title="Overdue"
          value={overdueInvoices.length.toString()}
          subtitle={fmt.format(overdueTotal)}
          icon={AlertTriangle}
          color="orange"
        />
        <StatsCard
          title="Avg Days to Pay"
          value={avgDaysToPay.toString()}
          subtitle="days"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Revenue Chart & Aging */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart payments={demoPayments} />
        <AgingReport
          invoices={demoInvoices}
          onBucketClick={(bucket) => setAgingBucket(agingBucket === bucket ? null : bucket)}
          activeBucket={agingBucket}
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
        >
          <option value="all">All Time</option>
          <option value="this_month">This Month</option>
          <option value="last_30">Last 30 Days</option>
          <option value="last_90">Last 90 Days</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          {activeFilters.map((f) => (
            <span key={f} className="rounded-full bg-[#0085FF]/10 px-3 py-1 text-xs font-medium text-[#0085FF]">
              {f}
            </span>
          ))}
          <button
            onClick={() => {
              setStatusFilter("");
              setDateRange("all");
              setAgingBucket(null);
            }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Batch actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#0085FF]/30 bg-[#0085FF]/5 p-3">
          <span className="text-sm font-medium text-[#0085FF]">
            {selectedIds.size} selected
          </span>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <Send className="h-3 w-3" />
            Send Reminders
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <Download className="h-3 w-3" />
            Download PDFs
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <CheckCircle2 className="h-3 w-3" />
            Mark as Paid
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.size === invoices.length && invoices.length > 0}
                  onChange={selectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-4">Invoice #</th>
              <th className="px-4 py-4">Customer</th>
              <th className="px-4 py-4 text-right">Amount</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Sent</th>
              <th className="px-4 py-4">Due Date</th>
              <th className="px-4 py-4">Payment Link</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const statusCfg = INVOICE_STATUS_CONFIG[inv.status];
              const isPastDue = new Date(inv.due_date) < new Date() && !["paid", "cancelled"].includes(inv.status);
              const canRemind = ["sent", "viewed", "overdue"].includes(inv.status);
              const canMarkPaid = ["sent", "viewed", "overdue"].includes(inv.status);

              return (
                <tr key={inv.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-[#0085FF] hover:text-[#0177E3]">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {inv.customer?.name ?? "Unknown"}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-slate-700">
                    {fmt.format(inv.total)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.color} ${statusCfg.bgColor}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : "--"}
                  </td>
                  <td className={`px-4 py-4 text-sm ${isPastDue ? "font-medium text-red-500" : "text-slate-500"}`}>
                    {new Date(inv.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    {inv.status !== "draft" && inv.status !== "cancelled" && (
                      <button
                        onClick={() => handleCopyLink(inv.id)}
                        className="flex items-center gap-1 text-xs text-[#0085FF] hover:text-[#0177E3]"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedLink === inv.id ? "Copied!" : "Copy Link"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {canRemind && (
                        <button
                          onClick={() => handleRemind(inv.id)}
                          className={`rounded-lg px-2 py-1 text-xs transition-colors ${
                            reminderSent.has(inv.id)
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          }`}
                        >
                          {reminderSent.has(inv.id) ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Sent
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              Remind
                            </span>
                          )}
                        </button>
                      )}
                      {canMarkPaid && (
                        <button
                          onClick={() => setShowMarkPaid(inv.id)}
                          className="rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-600 transition-colors hover:bg-emerald-100"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mark as Paid Modal */}
      {showMarkPaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">Mark as Paid</h3>
              <button onClick={() => setShowMarkPaid(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <div className="flex gap-2">
                  {(["cash", "check", "other"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        paymentMethod === m
                          ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
                          : "border-slate-200 text-slate-500 hover:border-[#0085FF]/30"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {paymentMethod === "check" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Check Number</label>
                  <input
                    type="text"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date Received</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="Any additional notes..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMarkPaid(null)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMarkPaid(showMarkPaid)}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
