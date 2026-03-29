"use client";

import { use, useState, useEffect, useMemo } from "react";
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
  Plus,
  Trash2,
  Save,
  X,
  FileSpreadsheet,
  Ban,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { INVOICE_STATUS_CONFIG } from "@/lib/types";
import type { InvoiceStatus, PaymentMethod, InvoiceLineItem, Invoice, Customer, Payment, Estimate } from "@/lib/types";
import PaymentTimeline from "@/components/PaymentTimeline";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function newLineItem(): InvoiceLineItem {
  return {
    id: `ili-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    description: "",
    quantity: 1,
    unit_price: 0,
    total: 0,
  };
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [linkedEstimate, setLinkedEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([newLineItem()]);
  const [taxRate, setTaxRate] = useState("7");
  const [internalNotes, setInternalNotes] = useState("");
  const [externalNotes, setExternalNotes] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("check");
  const [checkNumber, setCheckNumber] = useState("");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [showPreview, setShowPreview] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then(r => r.json()),
      fetch(`/api/payments?invoice_id=${id}`).then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/estimates').then(r => r.json()),
    ])
      .then(([invoiceData, paymentsData, customersData, estimatesData]) => {
        if (invoiceData && !invoiceData.error) {
          setInvoice(invoiceData);
          setStatus(invoiceData.status || "draft");
          setLineItems(invoiceData.line_items || [newLineItem()]);
          setTaxRate(invoiceData.tax_rate ? (invoiceData.tax_rate * 100).toFixed(0) : "7");
          setExternalNotes(invoiceData.notes || "");
          setCustomer(customersData.find((c: Customer) => c.id === invoiceData.customer_id) ?? null);
          if (invoiceData.estimate_id) {
            setLinkedEstimate(estimatesData.find((e: Estimate) => e.id === invoiceData.estimate_id) ?? null);
          }
        }
        setPayments(paymentsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-[var(--muted)]">Loading...</div>
    </div>
  );

  if (!invoice) {
    return (
      <div className="p-4 pt-16 lg:p-8 lg:pt-8">
        <Link href="/invoices" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <p className="text-slate-500">Invoice not found.</p>
        </div>
      </div>
    );
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);
  const taxRateDecimal = (parseFloat(taxRate) || 0) / 100;
  const taxAmount = subtotal * taxRateDecimal;
  const total = subtotal + taxAmount;
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = total - amountPaid;
  const statusCfg = INVOICE_STATUS_CONFIG[status];
  const paymentLink = `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${invoice.id}`;

  const timelineSteps = [
    { label: "Created", date: invoice.created_at },
    { label: "Sent", date: invoice.sent_at },
    { label: "Viewed", date: invoice.viewed_at },
    { label: "Paid", date: invoice.paid_at, description: invoice.payment_method || undefined },
  ];

  function handleCopyLink() {
    navigator.clipboard.writeText(paymentLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function updateLineItem(index: number, field: keyof InvoiceLineItem, value: string | number) {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === "description") item.description = value as string;
      else if (field === "quantity") {
        item.quantity = Number(value) || 0;
        item.total = item.quantity * item.unit_price;
      } else if (field === "unit_price") {
        item.unit_price = Number(value) || 0;
        item.total = item.quantity * item.unit_price;
      }
      updated[index] = item;
      return updated;
    });
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <Save className="h-4 w-4" /> Save
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0177E3]">
            <Send className="h-4 w-4" /> {invoice.sent_at ? "Resend" : "Send to Customer"}
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button onClick={handleCopyLink} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <Copy className="h-4 w-4" /> {linkCopied ? "Copied!" : "Payment Link"}
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <FileSpreadsheet className="h-4 w-4" /> QuickBooks
          </button>
          {status !== "cancelled" && status !== "paid" && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <Ban className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Payment Timeline */}
      <div className="mb-6">
        <PaymentTimeline steps={timelineSteps} />
      </div>

      {/* Invoice Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>
          Invoice {invoice.invoice_number}
        </h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusCfg.color} ${statusCfg.bgColor}`}>
          {statusCfg.label}
        </span>
        {linkedEstimate && (
          <Link
            href={`/estimates/${linkedEstimate.id}`}
            className="text-xs text-[#0085FF] hover:underline"
          >
            From Estimate #{linkedEstimate.id}
          </Link>
        )}
        {/* Split toggle */}
        <button
          onClick={() => setSplitEnabled(!splitEnabled)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          {splitEnabled ? <ToggleRight className="h-4 w-4 text-[#0085FF]" /> : <ToggleLeft className="h-4 w-4" />}
          Split Invoice
        </button>
      </div>

      {splitEnabled && (
        <div className="mb-6 rounded-lg border border-[#0085FF]/30 bg-[#0085FF]/5 p-4">
          <p className="text-sm font-medium text-[#0085FF] mb-2">Split Payment</p>
          <div className="flex items-center gap-4">
            <label className="text-xs text-slate-600">Deposit:</label>
            <input
              type="number"
              value={splitPercent}
              onChange={(e) => setSplitPercent(Number(e.target.value))}
              className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-[#0085FF] focus:outline-none"
            />
            <span className="text-xs text-slate-500">% ({fmt.format(total * splitPercent / 100)}) due immediately</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">Final: {fmt.format(total * (100 - splitPercent) / 100)} due on completion</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Main: 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          {/* Customer info */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Bill To</p>
                {customer && (
                  <>
                    <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-slate-700 hover:text-[#0085FF]">
                      {customer.name}
                    </Link>
                    {customer.address && <p className="text-sm text-slate-500">{customer.address}</p>}
                    {customer.city && <p className="text-sm text-slate-500">{customer.city}, {customer.state} {customer.zip}</p>}
                    {customer.email && <p className="text-sm text-slate-500 mt-1">{customer.email}</p>}
                  </>
                )}
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Due Date</p>
                  <p className="text-sm text-slate-700">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                {invoice.viewed_at && (
                  <div className="flex items-center justify-end gap-1 text-xs text-cyan-600">
                    <Eye className="h-3 w-3" />
                    Viewed {new Date(invoice.viewed_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0F172A]">Line Items</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Pencil className="h-3 w-3" />
                  {editing ? "Done" : "Edit"}
                </button>
                {editing && (
                  <button
                    onClick={() => setLineItems([...lineItems, newLineItem()])}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Plus className="h-3 w-3" /> Add Row
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500 border-b border-slate-200 bg-slate-50">
                    {editing && <th className="px-3 py-2 w-8" />}
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 text-right w-20">Qty</th>
                    <th className="px-4 py-2 text-right w-28">Unit Price</th>
                    <th className="px-4 py-2 text-right w-28">Total</th>
                    {editing && <th className="px-3 py-2 w-8" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((li, idx) => (
                    <tr key={li.id}>
                      {editing && (
                        <td className="px-3 py-2">
                          <GripVertical className="h-4 w-4 text-slate-300 cursor-grab" />
                        </td>
                      )}
                      <td className="px-4 py-2">
                        {editing ? (
                          <input
                            type="text"
                            value={li.description}
                            onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                            className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-[#0085FF] focus:outline-none"
                          />
                        ) : (
                          <span className="text-sm text-slate-600">{li.description}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {editing ? (
                          <input
                            type="number"
                            value={li.quantity || ""}
                            onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                            className="w-16 rounded border border-slate-200 px-2 py-1 text-right text-sm focus:border-[#0085FF] focus:outline-none"
                          />
                        ) : (
                          <span className="text-sm text-slate-500">{li.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {editing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={li.unit_price || ""}
                            onChange={(e) => updateLineItem(idx, "unit_price", e.target.value)}
                            className="w-24 rounded border border-slate-200 px-2 py-1 text-right text-sm focus:border-[#0085FF] focus:outline-none"
                          />
                        ) : (
                          <span className="text-sm text-slate-500">{fmt.format(li.unit_price)}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-slate-700">
                        {fmt.format(li.quantity * li.unit_price)}
                      </td>
                      {editing && (
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-700">{fmt.format(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Tax (
                    {editing ? (
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-12 rounded border border-slate-200 px-1 py-0.5 text-center text-xs focus:border-[#0085FF] focus:outline-none"
                      />
                    ) : (
                      taxRate
                    )}
                    %)
                  </span>
                  <span className="text-slate-700">{fmt.format(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
                  <span className="text-[#0F172A]">Total</span>
                  <span className="text-emerald-600">{fmt.format(total)}</span>
                </div>
                {amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Paid</span>
                      <span className="text-emerald-600">-{fmt.format(amountPaid)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                      <span className="text-[#0F172A]">Balance Due</span>
                      <span className={amountDue > 0 ? "text-amber-600" : "text-emerald-600"}>
                        {fmt.format(amountDue)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Internal Notes</h3>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes (not visible to customer)..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:border-[#0085FF] focus:outline-none"
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">External Notes (on PDF)</h3>
              <textarea
                value={externalNotes}
                onChange={(e) => setExternalNotes(e.target.value)}
                rows={3}
                placeholder="Notes visible on the invoice PDF..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:border-[#0085FF] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sidebar: 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* PDF Preview */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0F172A]">PDF Preview</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-[#0085FF] hover:text-[#0177E3]"
              >
                {showPreview ? "Hide" : "Show"}
              </button>
            </div>
            {showPreview && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                <div className="mb-3 border-b border-slate-200 pb-3">
                  <p className="font-bold text-[#0F172A]">The Finishing Touch LLC</p>
                  <p className="text-slate-500">9909 East 100 South, Greentown, IN 46936</p>
                </div>
                <div className="mb-3 flex justify-between">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Bill To</p>
                    <p className="text-slate-700">{customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-slate-400">Invoice</p>
                    <p className="font-medium text-[#0085FF]">{invoice.invoice_number}</p>
                  </div>
                </div>
                <div className="mb-3 rounded border border-slate-200 bg-white">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-2 py-1 text-left text-slate-400">Desc</th>
                        <th className="px-2 py-1 text-right text-slate-400">Qty</th>
                        <th className="px-2 py-1 text-right text-slate-400">Price</th>
                        <th className="px-2 py-1 text-right text-slate-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((li) => (
                        <tr key={li.id} className="border-b border-slate-100">
                          <td className="px-2 py-1 text-slate-600">{li.description || "--"}</td>
                          <td className="px-2 py-1 text-right text-slate-500">{li.quantity}</td>
                          <td className="px-2 py-1 text-right text-slate-500">{fmt.format(li.unit_price)}</td>
                          <td className="px-2 py-1 text-right font-medium text-slate-700">{fmt.format(li.quantity * li.unit_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-slate-500">Subtotal: {fmt.format(subtotal)}</p>
                  <p className="text-slate-500">Tax ({taxRate}%): {fmt.format(taxAmount)}</p>
                  <p className="font-bold text-[#0F172A]">Total: {fmt.format(total)}</p>
                </div>
                {externalNotes && (
                  <div className="mt-3 border-t border-slate-200 pt-2 text-slate-500">
                    {externalNotes}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Link */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Payment Link</h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 break-all mb-2">{paymentLink}</p>
              <button onClick={handleCopyLink} className="flex items-center gap-1.5 text-xs font-medium text-[#0085FF] hover:text-[#0177E3]">
                <Copy className="h-3.5 w-3.5" />
                {linkCopied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* Customer Card */}
          {customer && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Customer</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0085FF] text-sm font-bold text-white">
                  {customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-slate-700 hover:text-[#0085FF]">
                    {customer.name}
                  </Link>
                  {customer.phone && <p className="text-xs text-slate-500">{customer.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Record Payment */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Record Payment</h3>
            <button
              onClick={() => setShowRecordPayment(!showRecordPayment)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <DollarSign className="h-4 w-4" />
              Mark as Paid
            </button>
            {showRecordPayment && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  {(["cash", "check", "other"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize ${
                        paymentMethod === m
                          ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {paymentMethod === "check" && (
                  <input
                    type="text"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="Check number"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0085FF] focus:outline-none"
                  />
                )}
                <button
                  onClick={() => { setStatus("paid"); setShowRecordPayment(false); }}
                  className="w-full rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0177E3]"
                >
                  Confirm Payment
                </button>
              </div>
            )}
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Payment History</h3>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{fmt.format(p.amount)}</p>
                        <p className="text-xs text-slate-500 capitalize">{p.method}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">Cancel Invoice</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">This action cannot be undone. The customer will be notified if the invoice was already sent.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (required)..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:border-[#0085FF] focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Keep Invoice
              </button>
              <button
                onClick={() => { setStatus("cancelled"); setShowCancelModal(false); }}
                disabled={!cancelReason}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Cancel Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
