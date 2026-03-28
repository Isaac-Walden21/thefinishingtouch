"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";
import { demoCustomers, demoEstimates } from "@/lib/demo-data";
import type { InvoiceLineItem } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]";
const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none";
const labelClass = "block text-sm font-medium text-slate-700 mb-2";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function newLineItem(): InvoiceLineItem {
  return {
    id: `ili-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    quantity: 1,
    unit_price: 0,
    total: 0,
  };
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [estimateId, setEstimateId] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([newLineItem()]);
  const [taxRate, setTaxRate] = useState("7");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState(
    "Payment is due within 30 days. Please include your invoice number with your payment."
  );
  const [saving, setSaving] = useState(false);

  const customerEstimates = useMemo(() => {
    if (!customerId) return [];
    return demoEstimates.filter((e) => e.customer_id === customerId);
  }, [customerId]);

  function handleEstimateSelect(estId: string) {
    setEstimateId(estId);
    if (!estId) return;
    const est = demoEstimates.find((e) => e.id === estId);
    if (!est) return;
    const items: InvoiceLineItem[] = est.line_items.map((li) => ({
      id: `ili-est-${li.id}`,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_cost,
      total: li.total,
    }));
    setLineItems(items.length > 0 ? items : [newLineItem()]);
  }

  function updateLineItem(index: number, field: keyof InvoiceLineItem, value: string | number) {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === "description") {
        item.description = value as string;
      } else if (field === "quantity") {
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

  function addLineItem() {
    setLineItems((prev) => [...prev, newLineItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxRateDecimal = (parseFloat(taxRate) || 0) / 100;
  const taxAmount = subtotal * taxRateDecimal;
  const total = subtotal + taxAmount;

  function handleSave(send: boolean) {
    setSaving(true);
    setTimeout(() => {
      router.push("/invoices");
    }, 500);
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <Link
        href="/invoices"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Create Invoice</h1>
        <p className="text-sm text-slate-500 mb-8">
          Create a new invoice for a customer. Link to an existing estimate to
          auto-populate line items.
        </p>

        <div className="space-y-8">
          {/* Customer & Estimate */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
              Customer & Estimate
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setEstimateId("");
                  }}
                  className={selectClass}
                >
                  <option value="">Select a customer...</option>
                  {demoCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Link to Estimate</label>
                <select
                  value={estimateId}
                  onChange={(e) => handleEstimateSelect(e.target.value)}
                  disabled={!customerId || customerEstimates.length === 0}
                  className={selectClass}
                >
                  <option value="">
                    {!customerId
                      ? "Select a customer first"
                      : customerEstimates.length === 0
                        ? "No estimates for this customer"
                        : "Select an estimate..."}
                  </option>
                  {customerEstimates.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.project_type} — {fmt.format(e.total)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#0F172A]">Line Items</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-xs font-medium uppercase tracking-wider text-slate-500 px-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>

              {lineItems.map((li, idx) => (
                <div key={li.id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={li.description}
                      onChange={(e) =>
                        updateLineItem(idx, "description", e.target.value)
                      }
                      placeholder="Description"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={li.quantity || ""}
                      onChange={(e) =>
                        updateLineItem(idx, "quantity", e.target.value)
                      }
                      placeholder="1"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={li.unit_price || ""}
                      onChange={(e) =>
                        updateLineItem(idx, "unit_price", e.target.value)
                      }
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium text-slate-700">
                    {fmt.format(li.total)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Totals */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
              Tax & Totals
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="7"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Indiana sales tax default: 7%
                </p>
              </div>
              <div className="flex items-end">
                <div className="w-full space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-700">{fmt.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax ({taxRate}%)</span>
                    <span className="text-slate-700">{fmt.format(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                    <span className="text-[#0F172A]">Total</span>
                    <span className="text-emerald-600">{fmt.format(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Due Date & Notes */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
              Details
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes / Terms</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Payment terms, notes..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || !customerId}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !customerId || !dueDate}
              className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {saving ? "Sending..." : "Send to Customer"}
            </button>
            <Link
              href="/invoices"
              className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
