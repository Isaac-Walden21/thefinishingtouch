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
} from "lucide-react";
import { demoCustomers, demoVisionProjects } from "@/lib/demo-data";
import { PROJECT_TYPES } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-700/50 bg-[#0d1526] px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const selectClass =
  "w-full rounded-lg border border-slate-700/50 bg-[#0d1526] px-4 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none";

interface VisionResult {
  image_url: string | null;
  prompt_used: string;
  suggested_add_ons: string[];
  demo_mode: boolean;
  message?: string;
}

interface Iteration {
  id: string;
  image_url: string | null;
  prompt_used: string;
  add_on: string | null;
}

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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
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
      alert("Failed to generate visualization. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function clearUpload() {
    setUploadedImage(null);
    setUploadedFile(null);
    setResult(null);
    setIterations([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const hasResult = result !== null;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            AI Vision Studio
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Upload a photo and visualize the finished project with AI
          </p>
        </div>
        <Link
          href="/vision/history"
          className="flex items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
        >
          <History className="h-4 w-4" />
          View History
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Upload & Controls */}
        <div className="space-y-6">
          {/* Upload Zone */}
          <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Customer Photo
            </h2>

            {!uploadedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700/50 bg-[#0d1526] hover:border-slate-600"
                }`}
              >
                <Upload className="h-10 w-10 text-slate-500 mb-4" />
                <p className="text-sm font-medium text-slate-300 mb-1">
                  Drag & drop a photo here
                </p>
                <p className="text-xs text-slate-500">
                  or click to browse files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded photo"
                  className="w-full rounded-lg object-cover max-h-80"
                />
                <button
                  onClick={clearUpload}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Service Type *
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className={selectClass}
              >
                <option value="">Select service type...</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                What do you want done? *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. I want a stamped concrete patio with a fire pit in the backyard"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Link to Customer (optional)
              </label>
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

            <button
              onClick={() => handleGenerate(null)}
              disabled={!serviceType || !description || generating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating Vision..." : "Generate Vision"}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {!hasResult ? (
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-12 flex flex-col items-center justify-center min-h-[400px]">
              <Camera className="h-16 w-16 text-slate-700 mb-4" />
              <p className="text-sm text-slate-500 text-center max-w-xs">
                Upload a photo, choose a service type, and describe what you
                want. AI will generate a photorealistic visualization.
              </p>
            </div>
          ) : (
            <>
              {/* Before / After */}
              <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Visualization Result
                </h2>

                {result.demo_mode && result.message && (
                  <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
                    {result.message}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Original
                    </p>
                    {uploadedImage ? (
                      <img
                        src={uploadedImage}
                        alt="Original"
                        className="w-full rounded-lg object-cover aspect-[4/3]"
                      />
                    ) : (
                      <div className="w-full rounded-lg bg-[#0d1526] aspect-[4/3] flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-slate-700" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      AI Vision
                    </p>
                    {iterations[selectedIteration]?.image_url ? (
                      <img
                        src={iterations[selectedIteration].image_url!}
                        alt="AI Generated"
                        className="w-full rounded-lg object-cover aspect-[4/3]"
                      />
                    ) : (
                      <div className="w-full rounded-lg bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-slate-700/50 aspect-[4/3] flex flex-col items-center justify-center">
                        <Sparkles className="h-8 w-8 text-blue-400/50 mb-2" />
                        <p className="text-xs text-slate-500 text-center px-4">
                          Image generation requires GEMINI_API_KEY
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-[#0d1526] p-3">
                  <p className="text-xs text-slate-500 mb-1">
                    AI-Optimized Prompt:
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    {iterations[selectedIteration]?.prompt_used ||
                      result.prompt_used}
                  </p>
                </div>
              </div>

              {/* Iterations Gallery */}
              {iterations.length > 1 && (
                <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Iterations ({iterations.length})
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {iterations.map((iter, idx) => (
                      <button
                        key={iter.id}
                        onClick={() => setSelectedIteration(idx)}
                        className={`flex-shrink-0 rounded-lg border-2 overflow-hidden transition-colors ${
                          selectedIteration === idx
                            ? "border-blue-500"
                            : "border-slate-700/50 hover:border-slate-600"
                        }`}
                      >
                        <div className="w-20 h-16 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center">
                          {iter.image_url ? (
                            <img
                              src={iter.image_url}
                              alt={`Iteration ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-500">
                              #{idx + 1}
                            </span>
                          )}
                        </div>
                        {iter.add_on && (
                          <p className="px-1.5 py-1 text-[10px] text-slate-400 truncate max-w-20">
                            + {iter.add_on.split(" ").slice(0, 2).join(" ")}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-On Suggestions */}
              {result.suggested_add_ons.length > 0 && (
                <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Want to see more?
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.suggested_add_ons.map((addOn) => (
                      <button
                        key={addOn}
                        onClick={() => handleGenerate(addOn)}
                        disabled={generating}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-[#0d1526] px-3 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/50 hover:text-blue-400 disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                        {addOn.charAt(0).toUpperCase() + addOn.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                  <User className="h-4 w-4" />
                  Save to Customer
                </button>
                <button className="flex items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
                  Share with Customer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Vision Projects */}
      {demoVisionProjects.length > 0 && !hasResult && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Visualizations
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demoVisionProjects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-4 transition-colors hover:border-slate-600"
              >
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {proj.service_type}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {proj.customer_name}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                  {proj.description}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {proj.iterations.length} iteration
                    {proj.iterations.length !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {new Date(proj.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
