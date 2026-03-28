"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
  Info,
  X,
  Plus,
  Trash2,
  GripVertical,
  Save,
  FileText,
  Send,
  ArrowRightLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  HardHat,
} from "lucide-react";
import { demoCustomers, demoJobWalks } from "@/lib/demo-data";
import type { EstimateLineItem, AIFlag } from "@/lib/types";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

interface DraftEstimate {
  id: string;
  customer_id: string | null;
  customer_name: string;
  project_type: string;
  dimensions: Record<string, number | undefined>;
  materials: string[];
  complexity: string;
  options: { demolition: boolean; grading: boolean; sealing: boolean; color_stain: string };
  line_items: EstimateLineItem[];
  subtotal: number;
  margin: number;
  total: number;
  timeline: string;
  notes: string;
}

interface JobWalkData {
  id: string;
  customer_id: string | null;
  customer_name: string;
  lead_id: string | null;
  project_type: string;
  dimensions: Record<string, number | undefined>;
  materials: string[];
  color_stain: string;
  complexity: string;
  options: { demolition: boolean; grading: boolean; sealing: boolean };
  photos: Array<{ id: string; storage_path: string; label: string }>;
  notes: string;
  ai_flags: AIFlag[];
  status: string;
  created_at: string;
}

export default function JobWalkReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Try to load from sessionStorage (came from form submission) or fall back to demo data
  const [jobWalk, setJobWalk] = useState<JobWalkData | null>(null);
  const [estimate, setEstimate] = useState<DraftEstimate | null>(null);
  const [aiFlags, setAiFlags] = useState<AIFlag[]>([]);
  const [marginPercent, setMarginPercent] = useState(25);
  const [saving, setSaving] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage for freshly generated data
    const cached = sessionStorage.getItem(`job-walk-${id}`);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setJobWalk(data.job_walk);
        setEstimate(data.estimate);
        setAiFlags(data.job_walk.ai_flags || []);
        setLoading(false);
        return;
      } catch {
        // fall through to demo data
      }
    }

    // Fall back to demo data
    const demoWalk = demoJobWalks.find((jw) => jw.id === id);
    if (demoWalk) {
      setJobWalk({
        id: demoWalk.id,
        customer_id: demoWalk.customer_id,
        customer_name: demoWalk.customer_name,
        lead_id: demoWalk.lead_id,
        project_type: demoWalk.project_type,
        dimensions: demoWalk.dimensions,
        materials: demoWalk.materials,
        color_stain: demoWalk.color_stain,
        complexity: demoWalk.complexity,
        options: demoWalk.options,
        photos: demoWalk.photos,
        notes: demoWalk.notes,
        ai_flags: demoWalk.ai_flags,
        status: demoWalk.status,
        created_at: demoWalk.created_at,
      });
      setAiFlags(demoWalk.ai_flags);

      // Generate estimate from demo data via API
      fetch("/api/estimates/job-walk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: demoWalk.customer_id,
          customer_name: demoWalk.customer_name,
          lead_id: demoWalk.lead_id,
          project_type: demoWalk.project_type,
          dimensions: demoWalk.dimensions,
          materials: demoWalk.materials,
          color_stain: demoWalk.color_stain,
          complexity: demoWalk.complexity,
          options: demoWalk.options,
          photo_count: demoWalk.photos.length,
          notes: demoWalk.notes,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          setEstimate(data.estimate);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  // ── Line item editing ──
  function updateLineItem(
    itemId: string,
    field: keyof EstimateLineItem,
    value: string | number
  ) {
    if (!estimate) return;
    setEstimate((prev) => {
      if (!prev) return prev;
      const items = prev.line_items.map((li) => {
        if (li.id !== itemId) return li;
        const updated = { ...li, [field]: value };
        if (field === "quantity" || field === "unit_cost") {
          updated.total = Math.round((updated.quantity as number) * (updated.unit_cost as number));
        }
        return updated;
      });
      const subtotal = items.reduce((sum, li) => sum + li.total, 0);
      const margin = Math.round(subtotal * (marginPercent / 100));
      return { ...prev, line_items: items, subtotal, margin, total: subtotal + margin };
    });
  }

  function removeLineItem(itemId: string) {
    if (!estimate) return;
    setEstimate((prev) => {
      if (!prev) return prev;
      const items = prev.line_items.filter((li) => li.id !== itemId);
      const subtotal = items.reduce((sum, li) => sum + li.total, 0);
      const margin = Math.round(subtotal * (marginPercent / 100));
      return { ...prev, line_items: items, subtotal, margin, total: subtotal + margin };
    });
  }

  function addLineItem(category: "material" | "labor" | "equipment") {
    if (!estimate) return;
    const newItem: EstimateLineItem = {
      id: `gen-new-${Date.now()}`,
      category,
      description: "",
      quantity: 1,
      unit: category === "labor" ? "hours" : "each",
      unit_cost: 0,
      total: 0,
    };
    setEstimate((prev) => {
      if (!prev) return prev;
      return { ...prev, line_items: [...prev.line_items, newItem] };
    });
  }

  function updateMargin(newPercent: number) {
    setMarginPercent(newPercent);
    setEstimate((prev) => {
      if (!prev) return prev;
      const margin = Math.round(prev.subtotal * (newPercent / 100));
      return { ...prev, margin, total: prev.subtotal + margin };
    });
  }

  function dismissFlag(flagId: string) {
    setAiFlags((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, dismissed: true } : f))
    );
  }

  function handleSaveDraft() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Draft saved successfully.");
    }, 600);
  }

  const customer = jobWalk?.customer_id
    ? demoCustomers.find((c) => c.id === jobWalk.customer_id)
    : null;

  const activeFlags = aiFlags.filter((f) => !f.dismissed);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0085FF] mx-auto mb-3" />
          <p className="text-sm text-slate-500">Generating estimate...</p>
        </div>
      </div>
    );
  }

  if (!jobWalk) {
    return (
      <div className="p-8">
        <Link
          href="/estimates"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to estimates
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <p className="text-slate-500">Job walk not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <Link
        href="/estimates"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to estimates
      </Link>

      {/* 1. Summary header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <HardHat className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              {jobWalk.customer_name}
            </h1>
            <p className="text-sm text-slate-500">
              {jobWalk.project_type} &mdash;{" "}
              {jobWalk.dimensions.square_footage
                ? `${jobWalk.dimensions.square_footage.toLocaleString()} sq ft`
                : jobWalk.dimensions.linear_feet
                  ? `${jobWalk.dimensions.linear_feet} linear ft`
                  : ""}{" "}
              &bull;{" "}
              {new Date(jobWalk.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
            <HardHat className="h-3 w-3" />
            Job Walk
          </span>
        </div>
      </div>

      {/* 2. AI Flags banner */}
      {activeFlags.length > 0 && (
        <div className="mb-6 space-y-2">
          {activeFlags.map((flag) => (
            <div
              key={flag.id}
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                flag.type === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : flag.type === "suggestion"
                    ? "border-blue-200 bg-blue-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              {flag.type === "warning" && (
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              {flag.type === "suggestion" && (
                <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              {flag.type === "info" && (
                <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <p className="flex-1 text-sm text-slate-700">{flag.message}</p>
              <button
                type="button"
                onClick={() => dismissFlag(flag.id)}
                className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {estimate && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content — editable line items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Items Table */}
            {(["material", "labor", "equipment"] as const).map((category) => {
              const items = estimate.line_items.filter(
                (li) => li.category === category
              );
              if (items.length === 0 && category === "equipment") return null;
              const categoryLabel =
                category === "material"
                  ? "Materials"
                  : category === "labor"
                    ? "Labor"
                    : "Equipment";
              const categoryColor =
                category === "material"
                  ? "text-[#0085FF]"
                  : category === "labor"
                    ? "text-orange-600"
                    : "text-purple-600";
              const categoryTotal = items.reduce((s, li) => s + li.total, 0);

              return (
                <div
                  key={category}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wider ${categoryColor}`}
                    >
                      {categoryLabel}
                    </h3>
                    <button
                      type="button"
                      onClick={() => addLineItem(category)}
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0085FF] transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map((li) => (
                      <div
                        key={li.id}
                        className="flex items-center gap-2 px-3 py-2.5 group"
                      >
                        <GripVertical className="h-4 w-4 text-slate-300 shrink-0 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={li.description}
                            onChange={(e) =>
                              updateLineItem(li.id, "description", e.target.value)
                            }
                            className="w-full border-0 bg-transparent text-sm text-slate-700 focus:outline-none focus:ring-0 p-0"
                            placeholder="Description"
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            value={li.quantity}
                            onChange={(e) =>
                              updateLineItem(
                                li.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 rounded border border-slate-200 px-2 py-1 text-xs text-right text-slate-600 focus:border-[#0085FF] focus:outline-none"
                          />
                          <span className="text-xs text-slate-400 w-12 text-center">
                            {li.unit}
                          </span>
                          <span className="text-xs text-slate-400">@</span>
                          <input
                            type="number"
                            value={li.unit_cost}
                            onChange={(e) =>
                              updateLineItem(
                                li.id,
                                "unit_cost",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 rounded border border-slate-200 px-2 py-1 text-xs text-right text-slate-600 focus:border-[#0085FF] focus:outline-none"
                          />
                          <span className="text-sm font-medium text-slate-700 w-20 text-right">
                            {fmt.format(li.total)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLineItem(li.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end px-5 py-2.5 bg-slate-50 border-t border-slate-200">
                    <span className="text-xs text-slate-500 mr-4">
                      {categoryLabel} Subtotal
                    </span>
                    <span className="text-sm font-medium text-slate-700 w-20 text-right">
                      {fmt.format(categoryTotal)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Totals */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-700 font-medium">
                      {fmt.format(estimate.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Margin</span>
                      <div className="flex items-center rounded border border-slate-200">
                        <input
                          type="number"
                          value={marginPercent}
                          onChange={(e) =>
                            updateMargin(parseFloat(e.target.value) || 0)
                          }
                          className="w-12 border-0 bg-transparent px-2 py-0.5 text-xs text-right text-slate-600 focus:outline-none focus:ring-0"
                        />
                        <span className="text-xs text-slate-400 pr-2">%</span>
                      </div>
                    </div>
                    <span className="text-slate-700 font-medium">
                      {fmt.format(estimate.margin)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-lg font-bold">
                    <span className="text-[#0F172A]">Total</span>
                    <span className="text-emerald-600">
                      {fmt.format(estimate.total)}
                    </span>
                  </div>
                  {estimate.timeline && (
                    <p className="text-xs text-slate-500 text-right">
                      Timeline: {estimate.timeline}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  Generate PDF
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]"
                >
                  <Send className="h-4 w-4" />
                  Send to Customer
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Convert to Invoice
                </button>
              </div>
            </div>

            {/* Customer Card */}
            {customer && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                  Customer
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0085FF] text-xs font-bold text-white">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm font-medium text-slate-700 hover:text-[#0085FF]"
                    >
                      {customer.name}
                    </Link>
                    {customer.phone && (
                      <p className="text-xs text-slate-500">{customer.phone}</p>
                    )}
                  </div>
                </div>
                {customer.email && (
                  <p className="text-xs text-slate-500">{customer.email}</p>
                )}
                {customer.address && (
                  <p className="text-xs text-slate-500 mt-1">
                    {customer.address}, {customer.city}
                  </p>
                )}
              </div>
            )}

            {/* Project Summary */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                Project Summary
              </h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Type</dt>
                  <dd className="text-slate-700">{jobWalk.project_type}</dd>
                </div>
                {jobWalk.dimensions.square_footage && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Area</dt>
                    <dd className="text-slate-700">
                      {jobWalk.dimensions.square_footage.toLocaleString()} sq ft
                    </dd>
                  </div>
                )}
                {jobWalk.dimensions.linear_feet && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Length</dt>
                    <dd className="text-slate-700">
                      {jobWalk.dimensions.linear_feet} linear ft
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Complexity</dt>
                  <dd className="capitalize text-slate-700">
                    {jobWalk.complexity}
                  </dd>
                </div>
                {jobWalk.materials.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Materials</dt>
                    <dd className="text-slate-700 text-right">
                      {jobWalk.materials.join(", ")}
                    </dd>
                  </div>
                )}
                {jobWalk.color_stain && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Color/Stain</dt>
                    <dd className="text-slate-700 text-right">
                      {jobWalk.color_stain}
                    </dd>
                  </div>
                )}
                {jobWalk.options.demolition && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Demolition</dt>
                    <dd className="text-amber-600">Yes</dd>
                  </div>
                )}
                {jobWalk.options.grading && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Grading</dt>
                    <dd className="text-amber-600">Yes</dd>
                  </div>
                )}
                {jobWalk.options.sealing && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Sealing</dt>
                    <dd className="text-emerald-600">Yes</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Photos & Notes (collapsible) */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPhotos(!showPhotos)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                  Photos & Notes
                  {jobWalk.photos.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {jobWalk.photos.length}
                    </span>
                  )}
                </div>
                {showPhotos ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {showPhotos && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-200 pt-3">
                  {jobWalk.photos.length > 0 ? (
                    jobWalk.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-100 p-2"
                      >
                        <div className="h-12 w-12 rounded bg-slate-200 flex items-center justify-center shrink-0">
                          <ImageIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-600">
                          {photo.label || "Unlabeled photo"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">
                      No photos captured
                    </p>
                  )}
                  {jobWalk.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        Notes
                      </p>
                      <p className="text-sm text-slate-600">{jobWalk.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
