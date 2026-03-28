"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Mic,
  MicOff,
  X,
  Loader2,
  HardHat,
} from "lucide-react";
import { demoCustomers, demoLeads } from "@/lib/demo-data";
import { PROJECT_TYPES, MATERIAL_OPTIONS } from "@/lib/types";

const LOCAL_STORAGE_KEY = "job-walk-draft";

interface PhotoEntry {
  id: string;
  dataUrl: string;
  label: string;
}

export default function JobWalkIntakePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0085FF]" />
        </div>
      }
    >
      <JobWalkIntakeForm />
    </Suspense>
  );
}

function JobWalkIntakeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillLeadId = searchParams.get("lead_id");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill from lead if navigating from a lead detail page
  const prefillLead = prefillLeadId
    ? demoLeads.find((l) => l.id === prefillLeadId)
    : null;
  const prefillCustomer = prefillLead
    ? demoCustomers.find((c) => c.id === prefillLead.customer_id)
    : null;

  // ── Form state ──
  const [customerId, setCustomerId] = useState(prefillCustomer?.id ?? "");
  const [customerSearch, setCustomerSearch] = useState(
    prefillCustomer?.name ?? ""
  );
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [projectType, setProjectType] = useState(
    prefillLead?.project_type ?? ""
  );
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("4");
  const [height, setHeight] = useState("");
  const [linearFeet, setLinearFeet] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [colorStain, setColorStain] = useState("");
  const [complexity, setComplexity] = useState<
    "easy" | "moderate" | "difficult"
  >("moderate");
  const [demolition, setDemolition] = useState(false);
  const [grading, setGrading] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Derived ──
  const sqft = useMemo(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    return l && w ? Math.round(l * w) : 0;
  }, [length, width]);

  const materialOptions = MATERIAL_OPTIONS[projectType] || [];
  const isLinearProject = projectType === "Decorative Curbing";
  const isFirewood = projectType === "Firewood Delivery";
  const isPostFrame = projectType === "Post Frame Building";
  const needsDimensions = !isFirewood;

  const filteredCustomers = demoCustomers.filter(
    (c) =>
      !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // ── Auto-save to localStorage ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = {
        customerId,
        customerSearch,
        projectType,
        length,
        width,
        depth,
        height,
        linearFeet,
        selectedMaterials,
        colorStain,
        complexity,
        demolition,
        grading,
        sealing,
        notes,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [
    customerId,
    customerSearch,
    projectType,
    length,
    width,
    depth,
    height,
    linearFeet,
    selectedMaterials,
    colorStain,
    complexity,
    demolition,
    grading,
    sealing,
    notes,
  ]);

  // ── Restore from localStorage on mount (only if no prefill) ──
  useEffect(() => {
    if (prefillLeadId) return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft.customerId) setCustomerId(draft.customerId);
      if (draft.customerSearch) setCustomerSearch(draft.customerSearch);
      if (draft.projectType) setProjectType(draft.projectType);
      if (draft.length) setLength(draft.length);
      if (draft.width) setWidth(draft.width);
      if (draft.depth) setDepth(draft.depth);
      if (draft.height) setHeight(draft.height);
      if (draft.linearFeet) setLinearFeet(draft.linearFeet);
      if (draft.selectedMaterials)
        setSelectedMaterials(draft.selectedMaterials);
      if (draft.colorStain) setColorStain(draft.colorStain);
      if (draft.complexity) setComplexity(draft.complexity);
      if (draft.demolition !== undefined) setDemolition(draft.demolition);
      if (draft.grading !== undefined) setGrading(draft.grading);
      if (draft.sealing !== undefined) setSealing(draft.sealing);
      if (draft.notes) setNotes(draft.notes);
    } catch {
      // ignore parse errors
    }
  }, [prefillLeadId]);

  // ── Photo capture ──
  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setPhotos((prev) => [
          ...prev,
          {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            dataUrl,
            label: "",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePhotoLabel(id: string, label: string) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, label } : p))
    );
  }

  // ── Voice-to-text for notes ──
  function toggleVoice() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionCtor() as any;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<{ 0: { transcript: string } }>)
        .map((r) => r[0].transcript)
        .join(" ");
      setNotes((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }

  // ── Submit ──
  async function handleSubmit() {
    if (!projectType || !customerId) return;
    setSubmitting(true);

    try {
      const body = {
        customer_id: customerId,
        customer_name:
          demoCustomers.find((c) => c.id === customerId)?.name ?? "",
        lead_id: prefillLeadId ?? null,
        project_type: projectType,
        dimensions: {
          length: parseFloat(length) || undefined,
          width: parseFloat(width) || undefined,
          depth: parseFloat(depth) || undefined,
          height: parseFloat(height) || undefined,
          square_footage: sqft || undefined,
          linear_feet: parseFloat(linearFeet) || undefined,
        },
        materials: selectedMaterials,
        color_stain: colorStain,
        complexity,
        options: { demolition, grading, sealing },
        photo_count: photos.length,
        notes,
      };

      const res = await fetch("/api/estimates/job-walk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const data = await res.json();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      // Store in sessionStorage so the review page can load it
      sessionStorage.setItem(`job-walk-${data.id}`, JSON.stringify(data));
      router.push(`/estimates/job-walk/${data.id}`);
    } catch {
      alert("Failed to submit job walk. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <Link
        href="/estimates"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to estimates
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <HardHat className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Job Walk</h1>
          <p className="text-xs text-slate-500">
            Capture site details — estimate generates automatically
          </p>
        </div>
      </div>

      {/* Single scrollable form */}
      <div className="space-y-6">
        {/* 1. Customer */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
            Customer
          </h2>
          <div className="relative">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
                if (!e.target.value) setCustomerId("");
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
            />
            {showCustomerDropdown && customerSearch && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                {filteredCustomers.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerSearch(c.name);
                      setShowCustomerDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.phone && (
                      <span className="text-slate-400 ml-2">{c.phone}</span>
                    )}
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-400">
                    No customers found
                  </div>
                )}
              </div>
            )}
          </div>
          {customerId && (
            <p className="mt-2 text-xs text-emerald-600">
              Linked to {customerSearch}
            </p>
          )}
        </div>

        {/* 2. Project Type — large tap buttons */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
            Project Type
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {PROJECT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setProjectType(t);
                  setSelectedMaterials([]);
                }}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors text-left ${
                  projectType === t
                    ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Dimensions — adapts per project type */}
        {projectType && needsDimensions && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
              Dimensions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {!isLinearProject && (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Length (ft)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="20"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Width (ft)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="16"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                    />
                  </div>
                  {(projectType === "Concrete Patio" ||
                    projectType === "Concrete Driveway" ||
                    projectType === "Stamped Concrete") && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Depth (in)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={depth}
                        onChange={(e) => setDepth(e.target.value)}
                        placeholder="4"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                      />
                    </div>
                  )}
                  {isPostFrame && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Height (ft)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="12"
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                      />
                    </div>
                  )}
                  {sqft > 0 && (
                    <div className="col-span-2">
                      <div className="rounded-lg bg-[#0085FF]/10 border border-[#0085FF]/30 px-4 py-2.5 text-sm text-[#0085FF] font-medium text-center">
                        {sqft.toLocaleString()} sq ft
                      </div>
                    </div>
                  )}
                </>
              )}
              {isLinearProject && (
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">
                    Linear Feet
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={linearFeet}
                    onChange={(e) => setLinearFeet(e.target.value)}
                    placeholder="120"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-700 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Materials & Colors */}
        {projectType && materialOptions.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
              Materials & Colors
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {materialOptions.map((mat) => (
                <button
                  key={mat}
                  type="button"
                  onClick={() =>
                    setSelectedMaterials((prev) =>
                      prev.includes(mat)
                        ? prev.filter((m) => m !== mat)
                        : [...prev, mat]
                    )
                  }
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedMaterials.includes(mat)
                      ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={colorStain}
              onChange={(e) => setColorStain(e.target.value)}
              placeholder="Color / Stain (e.g. Desert Tan with Dark Walnut Release)"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
            />
          </div>
        )}

        {/* 5. Site Conditions */}
        {projectType && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
              Site Conditions
            </h2>
            {/* Complexity toggle */}
            <div className="flex gap-2 mb-4">
              {(["easy", "moderate", "difficult"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setComplexity(level)}
                  className={`flex-1 rounded-lg border px-3 py-3 text-sm font-medium capitalize transition-colors ${
                    complexity === level
                      ? level === "easy"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                        : level === "moderate"
                          ? "border-amber-500 bg-amber-50 text-amber-600"
                          : "border-red-500 bg-red-50 text-red-500"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            {/* Checkboxes */}
            <div className="space-y-3">
              {[
                {
                  label: "Demolition needed",
                  checked: demolition,
                  onChange: setDemolition,
                },
                {
                  label: "Grading needed",
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
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={(e) => opt.onChange(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 bg-white text-[#0085FF] focus:ring-[#0085FF]"
                  />
                  <span className="text-sm text-slate-600">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 6. Photos */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Photos</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoCapture}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-sm font-medium text-slate-500 hover:border-[#0085FF] hover:text-[#0085FF] transition-colors"
          >
            <Camera className="h-5 w-5" />
            Tap to take photo or upload
          </button>
          {photos.length > 0 && (
            <div className="mt-3 space-y-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 p-2"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.label || "Job walk photo"}
                    className="h-16 w-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={photo.label}
                      onChange={(e) =>
                        updatePhotoLabel(photo.id, e.target.value)
                      }
                      placeholder="Label (e.g. existing slab)"
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Notes */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">Notes</h2>
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isListening
                  ? "border-red-400 bg-red-50 text-red-600"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
              }`}
            >
              {isListening ? (
                <MicOff className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
              {isListening ? "Stop" : "Voice"}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Additional notes, special requirements, site observations..."
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF] resize-none"
          />
          {isListening && (
            <p className="mt-2 text-xs text-red-500 animate-pulse">
              Listening... speak now
            </p>
          )}
        </div>

        {/* 8. Submit */}
        <button
          type="button"
          disabled={!projectType || !customerId || submitting}
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0085FF] to-purple-600 px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#0085FF]/20"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <HardHat className="h-5 w-5" />
          )}
          {submitting ? "Generating Estimate..." : "Generate Estimate"}
        </button>

        {/* Auto-save indicator */}
        <p className="text-center text-xs text-slate-400 pb-8">
          Form auto-saves as you type
        </p>
      </div>
    </div>
  );
}
