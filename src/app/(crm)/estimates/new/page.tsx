"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { demoCustomers } from "@/lib/demo-data";
import {
  PROJECT_TYPES,
  MATERIAL_OPTIONS,
  type EstimateLineItem,
} from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]";
const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none";
const labelClass = "block text-sm font-medium text-slate-700 mb-2";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

interface GeneratedEstimate {
  line_items: EstimateLineItem[];
  subtotal: number;
  margin: number;
  total: number;
  timeline: string;
}

export default function NewEstimatePage() {
  const router = useRouter();

  const [projectType, setProjectType] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("4");
  const [linearFeet, setLinearFeet] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<"easy" | "moderate" | "difficult">("moderate");
  const [demolition, setDemolition] = useState(false);
  const [grading, setGrading] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [colorStain, setColorStain] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState<GeneratedEstimate | null>(null);
  const [showLineItems, setShowLineItems] = useState(true);

  const sqft = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    return l && w ? Math.round(l * w) : 0;
  }, [length, width]);

  const materialOptions = MATERIAL_OPTIONS[projectType] || [];
  const isLinearProject = projectType === "Decorative Curbing";
  const isFirewood = projectType === "Firewood Delivery";
  const needsDimensions = !isFirewood;

  function toggleMaterial(mat: string) {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const body = {
        project_type: projectType,
        length: parseFloat(length) || undefined,
        width: parseFloat(width) || undefined,
        depth: parseFloat(depth) || undefined,
        linear_feet: parseFloat(linearFeet) || undefined,
        square_footage: sqft || undefined,
        materials: selectedMaterials,
        complexity,
        options: { demolition, grading, sealing, color_stain: colorStain },
        notes,
      };

      const res = await fetch("/api/estimates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to generate");

      const data = (await res.json()) as GeneratedEstimate;
      setGenerated(data);
    } catch {
      alert("Failed to generate estimate. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      router.push("/estimates");
    }, 500);
  }

  const customerName =
    demoCustomers.find((c) => c.id === customerId)?.name || "";

  return (
    <div className="p-8">
      <Link
        href="/estimates"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to estimates
      </Link>

      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
          Create New Estimate
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Fill in the project details and let AI generate a professional
          estimate.
        </p>

        <div className="space-y-8">
          {/* Project Type */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
              Project Details
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Project Type *</label>
                <select
                  value={projectType}
                  onChange={(e) => {
                    setProjectType(e.target.value);
                    setSelectedMaterials([]);
                    setGenerated(null);
                  }}
                  className={selectClass}
                >
                  <option value="">Select project type...</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimensions */}
              {needsDimensions && !isLinearProject && (
                <>
                  <div>
                    <label className={labelClass}>Length (ft)</label>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="e.g. 20"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Width (ft)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g. 16"
                      className={inputClass}
                    />
                  </div>
                  {(projectType === "Concrete Patio" ||
                    projectType === "Concrete Driveway" ||
                    projectType === "Stamped Concrete") && (
                    <div>
                      <label className={labelClass}>Depth (inches)</label>
                      <input
                        type="number"
                        value={depth}
                        onChange={(e) => setDepth(e.target.value)}
                        placeholder="4"
                        className={inputClass}
                      />
                    </div>
                  )}
                  {sqft > 0 && (
                    <div className="flex items-end">
                      <div className="rounded-lg bg-[#0085FF]/10 border border-[#0085FF]/30 px-4 py-2.5 text-sm text-[#0085FF] font-medium">
                        {sqft.toLocaleString()} sq ft
                      </div>
                    </div>
                  )}
                </>
              )}

              {isLinearProject && (
                <div>
                  <label className={labelClass}>Linear Feet</label>
                  <input
                    type="number"
                    value={linearFeet}
                    onChange={(e) => setLinearFeet(e.target.value)}
                    placeholder="e.g. 120"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Materials */}
          {projectType && materialOptions.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
                Materials & Finish
              </h2>
              <div className="flex flex-wrap gap-3">
                {materialOptions.map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => toggleMaterial(mat)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedMaterials.includes(mat)
                        ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-[#0085FF]/30 hover:text-slate-700"
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Complexity & Options */}
          {projectType && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
                Complexity & Options
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Site Access / Complexity</label>
                  <div className="flex gap-3">
                    {(
                      ["easy", "moderate", "difficult"] as const
                    ).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setComplexity(level)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                          complexity === level
                            ? level === "easy"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                              : level === "moderate"
                                ? "border-amber-500 bg-amber-50 text-amber-600"
                                : "border-red-500 bg-red-50 text-red-500"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-[#0085FF]/30"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Color / Stain</label>
                  <input
                    type="text"
                    value={colorStain}
                    onChange={(e) => setColorStain(e.target.value)}
                    placeholder="e.g. Desert Tan with Dark Walnut Release"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap gap-4">
                  {[
                    {
                      label: "Demolition / Removal needed",
                      checked: demolition,
                      onChange: setDemolition,
                    },
                    {
                      label: "Grading / Excavation",
                      checked: grading,
                      onChange: setGrading,
                    },
                    {
                      label: "Sealing",
                      checked: sealing,
                      onChange: setSealing,
                    },
                  ].map((opt) => (
                    <label
                      key={opt.label}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={opt.checked}
                        onChange={(e) => opt.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 bg-white text-[#0085FF] focus:ring-[#0085FF]"
                      />
                      <span className="text-sm text-slate-600">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Customer & Notes */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
              Customer & Notes
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Link to Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
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
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes or special requirements..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            disabled={!projectType || generating}
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0085FF] to-purple-600 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Generating Estimate..." : "Generate AI Estimate"}
          </button>

          {/* Generated Estimate Preview */}
          {generated && (
            <div className="rounded-xl border border-[#0085FF]/30 bg-white shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  Generated Estimate
                </h2>
                <span className="text-sm text-slate-500">
                  Timeline: {generated.timeline}
                </span>
              </div>

              {/* Line Items */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowLineItems(!showLineItems)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-[#0F172A] mb-4"
                >
                  {showLineItems ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Line Items ({generated.line_items.length})
                </button>

                {showLineItems && (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-right">Qty</th>
                          <th className="px-4 py-3 text-right">Unit Cost</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {generated.line_items.map((li) => (
                          <tr key={li.id}>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {li.description}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  li.category === "material"
                                    ? "text-[#0085FF] bg-[#0085FF]/10"
                                    : li.category === "labor"
                                      ? "text-orange-600 bg-orange-50"
                                      : "text-purple-600 bg-purple-50"
                                }`}
                              >
                                {li.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-slate-500">
                              {li.quantity} {li.unit}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-slate-500">
                              {fmt.format(li.unit_cost)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                              {fmt.format(li.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-700">
                      {fmt.format(generated.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Margin (25%)</span>
                    <span className="text-slate-700">
                      {fmt.format(generated.margin)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
                    <span className="text-[#0F172A]">Total</span>
                    <span className="text-emerald-600">
                      {fmt.format(generated.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3] disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving
                    ? "Saving..."
                    : `Save Estimate${customerName ? ` for ${customerName}` : ""}`}
                </button>
                <Link
                  href="/estimates"
                  className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
