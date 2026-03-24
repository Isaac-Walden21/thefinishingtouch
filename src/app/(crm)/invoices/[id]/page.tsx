"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Pencil,
  Download,
  CheckCircle2,
  DollarSign,
  Eye,
  Copy,
} from "lucide-react";
import { demoInvoices, demoCustomers, demoPayments } from "@/lib/demo-data";
import { INVOICE_STATUS_CONFIG } from "@/lib/types";
import type { InvoiceStatus, PaymentMethod } from "@/lib/types";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const invoice = demoInvoices.find((i) => i.id === id);
  const customer = invoice
    ? demoCustomers.find((c) => c.id === invoice.customer_id)
    : null;
  const payments = demoPayments.filter((p) => p.invoice_id === id);

  const [status, setStatus] = useState<InvoiceStatus>(
    invoice?.status || "draft"
  );
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("check");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  if (!invoice) {
    return (
      <div className="p-8">
        <Link
          href="/invoices"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-12 text-center">
          <p className="text-slate-400">Invoice not found.</p>
        </div>
      </div>
    );
  }

  const statusCfg = INVOICE_STATUS_CONFIG[status];
  const paymentLink = `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${invoice.id}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(paymentLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleRecordPayment() {
    setShowRecordPayment(false);
    setPaymentAmount("");
    setPaymentNotes("");
    setStatus("paid");
  }

  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = invoice.total - amountPaid;

  return (
    <div className="p-8">
      <Link
        href="/invoices"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Invoice {invoice.invoice_number}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Created {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusCfg.color} ${statusCfg.bgColor}`}
            >
              {statusCfg.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content — Invoice */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b border-slate-700/50 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    The Finishing Touch LLC
                  </h2>
                  <p className="text-sm text-slate-400">
                    9909 East 100 South
                  </p>
                  <p className="text-sm text-slate-400">
                    Greentown, IN 46936
                  </p>
                  <p className="text-sm text-slate-400">(765) 555-0100</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">INVOICE</p>
                  <p className="text-sm font-medium text-blue-400">
                    {invoice.invoice_number}
                  </p>
                </div>
              </div>

              {/* Bill To / Invoice Info */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    Bill To
                  </p>
                  {customer && (
                    <>
                      <p className="text-sm font-medium text-slate-200">
                        {customer.name}
                      </p>
                      {customer.address && (
                        <p className="text-sm text-slate-400">
                          {customer.address}
                        </p>
                      )}
                      {customer.city && (
                        <p className="text-sm text-slate-400">
                          {customer.city}, {customer.state} {customer.zip}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-slate-400 mt-1">
                          {customer.email}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Invoice Date
                    </p>
                    <p className="text-sm text-slate-200">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Due Date
                    </p>
                    <p className="text-sm text-slate-200">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  {invoice.viewed_at && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Viewed
                      </p>
                      <p className="text-sm text-cyan-400">
                        {new Date(invoice.viewed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-lg border border-slate-700/30 overflow-hidden mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-500 border-b border-slate-700/30">
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/20">
                    {invoice.line_items.map((li) => (
                      <tr key={li.id}>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {li.description}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-400">
                          {li.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-400">
                          {fmt.format(li.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-200">
                          {fmt.format(li.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-200">
                      {fmt.format(invoice.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      Tax ({(invoice.tax_rate * 100).toFixed(0)}%)
                    </span>
                    <span className="text-slate-200">
                      {fmt.format(invoice.tax_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700/50 pt-2 text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-emerald-400">
                      {fmt.format(invoice.total)}
                    </span>
                  </div>
                  {amountPaid > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Paid</span>
                        <span className="text-emerald-400">
                          -{fmt.format(amountPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700/50 pt-2 text-base font-bold">
                        <span className="text-white">Balance Due</span>
                        <span className={amountDue > 0 ? "text-yellow-400" : "text-emerald-400"}>
                          {fmt.format(amountDue)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mt-6 border-t border-slate-700/50 pt-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-slate-400">{invoice.notes}</p>
                </div>
              )}
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Payment History
                </h3>
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-slate-700/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                          <DollarSign className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {fmt.format(p.amount)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {p.method.charAt(0).toUpperCase() + p.method.slice(1)}
                            {p.notes && ` — ${p.notes}`}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Link */}
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Payment Link
              </h3>
              <div className="rounded-lg border border-slate-700/30 bg-[#0d1526] p-3">
                <p className="text-xs text-slate-400 break-all mb-2">
                  {paymentLink}
                </p>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {linkCopied ? "Copied!" : "Copy Link"}
                </button>
              </div>
              {invoice.viewed_at && (
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-400">
                  <Eye className="h-3.5 w-3.5" />
                  Read receipt: {new Date(invoice.viewed_at).toLocaleString()}
                </div>
              )}
            </div>

            {/* Customer Card */}
            {customer && (
              <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Customer
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm font-medium text-slate-200 hover:text-white"
                    >
                      {customer.name}
                    </Link>
                    {customer.phone && (
                      <p className="text-xs text-slate-400">{customer.phone}</p>
                    )}
                  </div>
                </div>
                {customer.email && (
                  <p className="text-sm text-slate-400">{customer.email}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="flex w-full items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800">
                  <Pencil className="h-4 w-4" />
                  Edit Invoice
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800">
                  <Send className="h-4 w-4" />
                  {invoice.sent_at ? "Resend Invoice" : "Send Invoice"}
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800">
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowRecordPayment(!showRecordPayment)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
                >
                  <DollarSign className="h-4 w-4" />
                  Record Payment
                </button>
                <button
                  onClick={() => setStatus("paid")}
                  className="flex w-full items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Paid
                </button>
              </div>
            </div>

            {/* Record Payment Panel */}
            {showRecordPayment && (
              <div className="rounded-xl border border-blue-500/30 bg-[#111a2e] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Record Payment
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={amountDue.toFixed(2)}
                      className="w-full rounded-lg border border-slate-700/50 bg-[#0d1526] px-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="w-full rounded-lg border border-slate-700/50 bg-[#0d1526] px-4 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="stripe">Stripe</option>
                      <option value="check">Check</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Check #, reference, etc."
                      className="w-full rounded-lg border border-slate-700/50 bg-[#0d1526] px-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleRecordPayment}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Save Payment
                  </button>
                </div>
              </div>
            )}

            {/* Status Info */}
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Invoice Details
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Status</dt>
                  <dd className={statusCfg.color}>{statusCfg.label}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Invoice #</dt>
                  <dd className="text-slate-200">{invoice.invoice_number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Due Date</dt>
                  <dd className="text-slate-200">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </dd>
                </div>
                {invoice.sent_at && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Sent</dt>
                    <dd className="text-slate-200">
                      {new Date(invoice.sent_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {invoice.paid_at && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Paid</dt>
                    <dd className="text-emerald-400">
                      {new Date(invoice.paid_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {invoice.payment_method && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Payment Method</dt>
                    <dd className="capitalize text-slate-200">
                      {invoice.payment_method}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
