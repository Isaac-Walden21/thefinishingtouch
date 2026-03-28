"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Camera,
  Sparkles,
  Loader2,
  Plus,
  Image as ImageIcon,
  History,
  User,
  X,
  Download,
  Share2,
  DollarSign,
  Layout,
  ChevronDown,
  Save,
} from "lucide-react";
import { demoCustomers, demoVisionProjects } from "@/lib/demo-data";
import { PROJECT_TYPES } from "@/lib/types";
import type { Annotation } from "@/lib/types";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import AnnotationCanvas from "@/components/AnnotationCanvas";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]";
const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none";

interface VisionResult {
  image_url: string | null;
  prompt_used: string;
  suggested_add_ons: string[];
  demo_mode: boolean;
  message?: string;
  estimated_cost?: { low: number; high: number };
}

interface Iteration {
  id: string;
  image_url: string | null;
  prompt_used: string;
  add_on: string | null;
}

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

export default function VisionStudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [selectedIteration, setSelectedIteration] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showCostOverlay, setShowCostOverlay] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleGenerate(addOn: string | null = null) {
    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append("service_type", serviceType);
      formData.append("description", description);
      if (addOn) formData.append("add_on", addOn);
      if (uploadedFile) formData.append("image", uploadedFile);

      const res = await fetch("/api/vision/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to generate");

      const data = (await res.json()) as VisionResult;
      setResult(data);

      const newIteration: Iteration = {
        id: `iter-${Date.now()}`,
        image_url: data.image_url,
        prompt_used: data.prompt_used,
        add_on: addOn,
      };
      setIterations((prev) => [...prev, newIteration]);
      setSelectedIteration(iterations.length);
    } catch {
      // Fallback demo result
      const demoResult: VisionResult = {
        image_url: null,
        prompt_used: `Generate a photorealistic ${serviceType} visualization: ${description}${addOn ? `. Additional feature: ${addOn}` : ""}`,
        suggested_add_ons: ["fire pit", "string lighting", "retaining wall", "outdoor kitchen"],
        demo_mode: true,
        message: "Demo mode: Image generation requires GEMINI_API_KEY",
        estimated_cost: { low: 3200, high: 5800 },
      };
      setResult(demoResult);
      const newIteration: Iteration = {
        id: `iter-${Date.now()}`,
        image_url: null,
        prompt_used: demoResult.prompt_used,
        add_on: addOn,
      };
      setIterations((prev) => [...prev, newIteration]);
      setSelectedIteration(iterations.length);
    } finally {
      setGenerating(false);
    }
  }

  function clearUpload() {
    setUploadedImage(null);
    setUploadedFile(null);
    setResult(null);
    setIterations([]);
    setAnnotations([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSaveToCustomer() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const hasResult = result !== null;
  const hasImages = uploadedImage && iterations[selectedIteration]?.image_url;

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>
            AI Vision Studio
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload a photo and visualize the finished project with AI
          </p>
        </div>
        <Link
          href="/vision/history"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <History className="h-4 w-4" />
          View History
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Upload & Controls */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Customer Photo</h2>
            {!uploadedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${
                  isDragging ? "border-[#0085FF] bg-[#0085FF]/5" : "border-slate-200 bg-slate-50 hover:border-[#0085FF]/30"
                }`}
              >
                <Upload className="h-10 w-10 text-slate-400 mb-4" />
                <p className="text-sm font-medium text-slate-600 mb-1">Drag and drop a photo here</p>
                <p className="text-xs text-slate-400">or click to browse (JPG, PNG, HEIC)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
                />
              </div>
            ) : (
              <div className="relative">
                <img src={uploadedImage} alt="Uploaded" className="w-full rounded-lg object-cover max-h-80" />
                <button onClick={clearUpload} className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Service Type *</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={selectClass}>
                <option value="">Select service type...</option>
                {PROJECT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">What do you want done? *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="e.g. I want a stamped concrete patio with a fire pit" className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Link to Customer (optional)</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={selectClass}>
                <option value="">Select a customer...</option>
                {demoCustomers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <button
              onClick={() => handleGenerate(null)}
              disabled={!serviceType || !description || generating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0085FF] to-purple-600 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating Vision..." : "Generate Vision"}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {!hasResult ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px]">
              <Camera className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-sm text-slate-500 text-center max-w-xs">
                Upload a photo, choose a service type, and describe what you want. AI will generate a photorealistic visualization.
              </p>
            </div>
          ) : (
            <>
              {/* Before/After Slider or two-image grid */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Visualization Result</h2>

                {result.demo_mode && result.message && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-600">
                    {result.message}
                  </div>
                )}

                {hasImages ? (
                  <div className="relative">
                    <BeforeAfterSlider
                      beforeSrc={uploadedImage!}
                      afterSrc={iterations[selectedIteration].image_url!}
                    />
                    {/* Annotation overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <AnnotationCanvas
                        width={800}
                        height={400}
                        annotations={annotations}
                        onChange={setAnnotations}
                        readOnly
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Original</p>
                      {uploadedImage ? (
                        <img src={uploadedImage} alt="Original" className="w-full rounded-lg object-cover aspect-[4/3]" />
                      ) : (
                        <div className="w-full rounded-lg bg-slate-100 aspect-[4/3] flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">AI Vision</p>
                      <div className="w-full rounded-lg bg-gradient-to-br from-[#0085FF]/10 to-purple-100 border border-slate-200 aspect-[4/3] flex flex-col items-center justify-center">
                        <Sparkles className="h-8 w-8 text-[#0085FF]/40 mb-2" />
                        <p className="text-xs text-slate-500 text-center px-4">Image generation requires GEMINI_API_KEY</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Annotation tools */}
                <div className="mt-4">
                  <AnnotationCanvas
                    width={800}
                    height={400}
                    annotations={annotations}
                    onChange={setAnnotations}
                  />
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">AI-Optimized Prompt:</p>
                  <p className="text-xs text-slate-600 italic">
                    {iterations[selectedIteration]?.prompt_used || result.prompt_used}
                  </p>
                </div>
              </div>

              {/* Cost Overlay */}
              {result.estimated_cost && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#0F172A]">Project Cost Estimate</h3>
                    <button
                      onClick={() => setShowCostOverlay(!showCostOverlay)}
                      className="text-xs text-[#0085FF] hover:text-[#0177E3]"
                    >
                      {showCostOverlay ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showCostOverlay && (
                    <div>
                      <p className="text-lg font-bold text-[#0F172A]">
                        {fmt.format(result.estimated_cost.low)} -- {fmt.format(result.estimated_cost.high)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Approximate range based on typical projects</p>
                      <Link
                        href={`/estimates/new${customerId ? `?customer=${customerId}` : ""}`}
                        className="mt-3 flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0177E3] w-fit"
                      >
                        <DollarSign className="h-4 w-4" />
                        Create Estimate
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Iterations Gallery */}
              {iterations.length > 1 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Iterations ({iterations.length})</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {iterations.map((iter, idx) => (
                      <button
                        key={iter.id}
                        onClick={() => setSelectedIteration(idx)}
                        className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-colors ${
                          selectedIteration === idx ? "border-[#0085FF]" : "border-slate-200 hover:border-[#0085FF]/30"
                        }`}
                      >
                        <div className="w-20 h-16 bg-gradient-to-br from-[#0085FF]/10 to-purple-100 flex items-center justify-center">
                          {iter.image_url ? (
                            <img src={iter.image_url} alt={`Iteration ${idx + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-slate-400">#{idx + 1}</span>
                          )}
                        </div>
                        {iter.add_on && (
                          <p className="px-1.5 py-1 text-[10px] text-slate-500 truncate max-w-20">+ {iter.add_on}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-On Suggestions */}
              {result.suggested_add_ons.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Want to see more?</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.suggested_add_ons.map((addOn) => (
                      <button
                        key={addOn}
                        onClick={() => handleGenerate(addOn)}
                        disabled={generating}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition-colors hover:border-[#0085FF]/30 hover:text-[#0085FF] disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                        {addOn.charAt(0).toUpperCase() + addOn.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveToCustomer}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    saved
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0085FF] text-white hover:bg-[#0177E3]"
                  }`}
                >
                  {saved ? <Save className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  {saved ? "Saved!" : "Save to Customer"}
                </button>

                {/* Share */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Share2 className="h-4 w-4" /> Share
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg p-1">
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        Email to Customer
                      </button>
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        Copy Shareable Link
                      </button>
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        Copy Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Download */}
                <div className="relative">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" /> Download
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showDownloadMenu && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-52 rounded-lg border border-slate-200 bg-white shadow-lg p-1">
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        After Image Only
                      </button>
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        Side-by-Side Comparison
                      </button>
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        With Annotations
                      </button>
                    </div>
                  )}
                </div>

                {/* Social */}
                <div className="relative">
                  <button
                    onClick={() => setShowSocialMenu(!showSocialMenu)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Layout className="h-4 w-4" /> Social Post
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showSocialMenu && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-52 rounded-lg border border-slate-200 bg-white shadow-lg p-1">
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        Square (Instagram)
                      </button>
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        16:9 (Facebook)
                      </button>
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                        9:16 (Stories)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Vision Projects */}
      {demoVisionProjects.length > 0 && !hasResult && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Recent Visualizations</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demoVisionProjects.map((proj) => (
              <div key={proj.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 transition-colors hover:border-[#0085FF]/30">
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-[#0085FF]/10 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{proj.service_type}</p>
                    <p className="text-xs text-slate-500 truncate">{proj.customer_name}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{proj.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{proj.iterations.length} iteration{proj.iterations.length !== 1 ? "s" : ""}</span>
                  <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
