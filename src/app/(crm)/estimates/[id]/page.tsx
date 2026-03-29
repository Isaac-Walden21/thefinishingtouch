"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Download,
  Copy,
  ArrowRight,
  Pencil,
  Save,
  Trash2,
  Plus,
  GripVertical,
  Upload,
  Link2,
  Bookmark,
  Eye,
  EyeOff,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { demoEstimates, demoCustomers } from "@/lib/demo-data";
import {
  ESTIMATE_STATUS_CONFIG,
  type EstimateStatus,
  type EstimateLineItem,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export default function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const estimate = demoEstimates.find((e) => e.id === id);
  const customer = estimate
    ? demoCustomers.find((c) => c.id === estimate.customer_id)
    : null;

  const [status, setStatus] = useState<EstimateStatus>(
    estimate?.status || "draft"
  );
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>(
    estimate?.line_items ?? []
  );
  const [marginPct, setMarginPct] = useState(25);
  const [showPreview, setShowPreview] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [externalNotes, setExternalNotes] = useState(estimate?.notes ?? "");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "Payment terms: 50% deposit upon acceptance, balance due upon completion. All work guaranteed for 1 year. Change orders will be quoted separately. Cancellation after acceptance incurs a 15% restocking fee on ordered materials."
  );

  if (!estimate) {
    return (
      <div className="p-4 pt-16 lg:p-8 lg:pt-8">
        <PageHeader backHref="/estimates" backLabel="Back to estimates" title="Estimate not found" />
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">Estimate not found.</p>
        </div>
      </div>
    );
  }

  // Computed totals
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_cost, 0);
  const marginAmount = Math.round(subtotal * (marginPct / 100));
  const total = subtotal + marginAmount;

  const statusCfg = ESTIMATE_STATUS_CONFIG[status];

  // Expiration
  const createdDate = new Date(estimate.created_at);
  const expiresDate = new Date(createdDate.getTime() + 30 * 86400000);
  const daysUntilExpiry = Math.ceil(
    (expiresDate.getTime() - Date.now()) / 86400000
  );

  function updateLineItem(
    itemId: string,
    field: keyof EstimateLineItem,
    value: string | number
  ) {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== itemId) return li;
        const updated = { ...li, [field]: value };
        if (field === "quantity" || field === "unit_cost") {
          updated.total = Number(updated.quantity) * Number(updated.unit_cost);
        }
        return updated;
      })
    );
  }

  function removeLineItem(itemId: string) {
    setLineItems((prev) => prev.filter((li) => li.id !== itemId));
  }

  function addLineItem() {
    const newItem: EstimateLineItem = {
      id: `li-new-${Date.now()}`,
      category: "material",
      description: "",
      quantity: 1,
      unit: "each",
      unit_cost: 0,
      total: 0,
    };
    setLineItems((prev) => [...prev, newItem]);
  }

  const materialItems = lineItems.filter((li) => li.category === "material");
  const laborItems = lineItems.filter((li) => li.category === "labor");
  const equipmentItems = lineItems.filter((li) => li.category === "equipment");

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Header with Actions */}
      <div className="mb-6">
        <Link
          href="/estimates"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to estimates
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Estimate #{estimate.id.replace("est-", "")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {estimate.project_type} -- {formatDate(estimate.created_at)}
              {daysUntilExpiry > 0 && (
                <span className="ml-2 text-slate-400">
                  Expires in {daysUntilExpiry} days
                </span>
              )}
              {daysUntilExpiry <= 0 && (
                <span className="ml-2 text-red-500">Expired</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Save className="h-4 w-4" />
              Save
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            {status === "accepted" && (
              <Link
                href={`/invoices/new?estimate=${estimate.id}`}
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-100 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                Convert to Invoice
              </Link>
            )}
            <button className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors">
              <Send className="h-4 w-4" />
              Send
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Bookmark className="h-4 w-4" />
              Save as Template
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Customer & Status */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Customer
              </p>
              <Link
                href={`/customers/${estimate.customer_id}`}
                className="text-sm font-medium text-brand hover:text-brand-hover"
              >
                {estimate.customer_name}
              </Link>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Project
              </p>
              <p className="text-sm font-medium text-slate-700">
                {estimate.project_type}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                Status
              </p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EstimateStatus)}
                className={clsx(
                  "rounded-full border-0 px-2.5 py-0.5 text-xs font-medium focus:outline-none",
                  statusCfg.color,
                  statusCfg.bgColor
                )}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>

          {/* Editable Line Items */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Line Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="w-8 py-3" />
                    <th className="px-2 py-3">Category</th>
                    <th className="px-2 py-3">Description</th>
                    <th className="px-2 py-3 text-right w-20">Qty</th>
                    <th className="px-2 py-3 w-20">Unit</th>
                    <th className="px-2 py-3 text-right w-24">Unit Cost</th>
                    <th className="px-2 py-3 text-right w-24">Total</th>
                    <th className="w-10 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((li) => (
                    <tr key={li.id} className="group">
                      <td className="py-2">
                        <GripVertical className="h-4 w-4 cursor-grab text-slate-300 opacity-0 group-hover:opacity-100" />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={li.category}
                          onChange={(e) =>
                            updateLineItem(li.id, "category", e.target.value)
                          }
                          className={clsx(
                            "rounded px-2 py-1 text-xs font-medium border-0 focus:outline-none focus:ring-1 focus:ring-brand",
                            li.category === "material" && "text-brand bg-brand/10",
                            li.category === "labor" && "text-orange-600 bg-orange-50",
                            li.category === "equipment" && "text-purple-600 bg-purple-50"
                          )}
                        >
                          <option value="material">Material</option>
                          <option value="labor">Labor</option>
                          <option value="equipment">Equipment</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={li.description}
                          onChange={(e) =>
                            updateLineItem(li.id, "description", e.target.value)
                          }
                          className="w-full rounded border border-transparent px-2 py-1 text-sm text-slate-700 hover:border-slate-200 focus:border-brand focus:outline-none"
                          placeholder="Description..."
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={li.quantity}
                          onChange={(e) =>
                            updateLineItem(li.id, "quantity", Number(e.target.value))
                          }
                          className="w-full rounded border border-transparent px-2 py-1 text-right text-sm text-slate-700 hover:border-slate-200 focus:border-brand focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={li.unit}
                          onChange={(e) =>
                            updateLineItem(li.id, "unit", e.target.value)
                          }
                          className="w-full rounded border border-transparent px-2 py-1 text-sm text-slate-500 hover:border-slate-200 focus:border-brand focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={li.unit_cost}
                          onChange={(e) =>
                            updateLineItem(li.id, "unit_cost", Number(e.target.value))
                          }
                          className="w-full rounded border border-transparent px-2 py-1 text-right text-sm text-slate-700 hover:border-slate-200 focus:border-brand focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2 text-right text-sm font-medium text-slate-700">
                        {formatCurrency(li.quantity * li.unit_cost)}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => removeLineItem(li.id)}
                          className="rounded p-1 text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={addLineItem}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-400 hover:border-brand hover:text-brand transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Line Item
            </button>

            {/* Totals */}
            <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-700">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">Margin</span>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={marginPct}
                      onChange={(e) => setMarginPct(Number(e.target.value))}
                      className="w-24 accent-brand"
                    />
                    <span className="text-xs font-medium text-brand w-8">
                      {marginPct}%
                    </span>
                  </div>
                  <span className="text-slate-700">{formatCurrency(marginAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-emerald-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Photo Attachments
            </h3>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition-colors hover:border-brand/30">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  Drag and drop photos or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-400">Max 10 photos</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Internal Notes
              </h3>
              <p className="mb-2 text-xs text-slate-400">
                Team only -- not on PDF
              </p>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Customer seems price-sensitive..."
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                External Notes
              </h3>
              <p className="mb-2 text-xs text-slate-400">
                Included on customer PDF
              </p>
              <textarea
                value={externalNotes}
                onChange={(e) => setExternalNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Price includes removal of existing slab..."
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Terms & Conditions
            </h3>
            <textarea
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            />
          </div>

          {/* Revision History */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Revision History
            </h3>
            <div className="flex items-center gap-3">
              <button className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
                Rev 1
              </button>
              <span className="text-xs text-slate-400">
                Original -- {formatDate(estimate.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* PDF Preview Panel */}
        <div className="hidden lg:block">
          <div className="sticky top-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                PDF Preview
              </h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
              >
                {showPreview ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {showPreview ? "Hide" : "Show"}
              </button>
            </div>

            {showPreview && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-xs">
                {/* Mini PDF preview */}
                <div className="border-b border-slate-200 pb-3 mb-3">
                  <p className="font-bold text-foreground text-sm">
                    The Finishing Touch LLC
                  </p>
                  <p className="text-slate-400">
                    Greentown, IN | (765) 555-0100
                  </p>
                </div>
                <div className="mb-3">
                  <p className="text-slate-400 uppercase text-[10px] tracking-wider">
                    Prepared For
                  </p>
                  <p className="font-medium text-slate-700">
                    {estimate.customer_name}
                  </p>
                  {customer?.address && (
                    <p className="text-slate-400">
                      {customer.address}, {customer.city}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <p className="text-slate-400 uppercase text-[10px] tracking-wider">
                    Project
                  </p>
                  <p className="font-medium text-slate-700">
                    {estimate.project_type}
                  </p>
                </div>

                {/* Line items summary */}
                <div className="border rounded border-slate-200 mb-3">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-[9px] uppercase text-slate-400">
                        <th className="px-2 py-1 text-left">Item</th>
                        <th className="px-2 py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.slice(0, 5).map((li) => (
                        <tr key={li.id}>
                          <td className="px-2 py-1 text-slate-600 truncate max-w-[200px]">
                            {li.description || "—"}
                          </td>
                          <td className="px-2 py-1 text-right text-slate-700">
                            {formatCurrency(li.quantity * li.unit_cost)}
                          </td>
                        </tr>
                      ))}
                      {lineItems.length > 5 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-2 py-1 text-center text-slate-400"
                          >
                            +{lineItems.length - 5} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1 border-t border-slate-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {externalNotes && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <p className="text-[10px] uppercase text-slate-400">Notes</p>
                    <p className="text-slate-600 mt-0.5">{externalNotes}</p>
                  </div>
                )}

                <div className="mt-3 border-t border-slate-200 pt-2">
                  <p className="text-[10px] uppercase text-slate-400">
                    Terms & Conditions
                  </p>
                  <p className="text-slate-400 mt-0.5 line-clamp-3">
                    {termsAndConditions}
                  </p>
                </div>
              </div>
            )}

            {/* Approval Link */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Customer Approval
              </h3>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-brand/30 hover:text-brand transition-colors">
                <Link2 className="h-4 w-4" />
                Generate Approval Link
              </button>
            </div>

            {/* Customer Card */}
            {customer && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Customer
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm font-medium text-slate-700 hover:text-brand"
                    >
                      {customer.name}
                    </Link>
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className="block text-xs text-brand hover:underline"
                      >
                        {customer.phone}
                      </a>
                    )}
                  </div>
                </div>
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="mt-2 block text-xs text-brand hover:underline"
                  >
                    {customer.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile PDF Preview Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide PDF Preview" : "Show PDF Preview"}
          </button>
        </div>
      </div>
    </div>
  );
}
