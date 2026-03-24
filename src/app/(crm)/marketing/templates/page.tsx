"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Eye,
  Edit3,
  Copy,
  X,
  Mail,
  Sparkles,
  Star,
  Image,
} from "lucide-react";
import { demoEmailTemplates } from "@/lib/demo-data";

const categoryLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  seasonal_promo: { label: "Seasonal Promo", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  new_service: { label: "New Service", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  project_showcase: { label: "Project Showcase", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  review_request: { label: "Review Request", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  custom: { label: "Custom", color: "text-slate-400", bgColor: "bg-slate-500/20" },
};

export default function MarketingTemplatesPage() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewTemplate = previewId
    ? demoEmailTemplates.find((t) => t.id === previewId)
    : null;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Templates</h1>
          <p className="mt-1 text-sm text-slate-400">
            Pre-built and custom templates for your campaigns.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          <Edit3 className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#0d1526] p-1 w-fit">
        <Link href="/marketing/contacts" className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">
          Contacts
        </Link>
        <Link href="/marketing/templates" className="rounded-md bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-400">
          Templates
        </Link>
        <Link href="/marketing/campaigns" className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">
          Campaigns
        </Link>
        <Link href="/marketing/automations" className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">
          Automations
        </Link>
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {demoEmailTemplates.map((template) => {
          const cat = categoryLabels[template.category] ?? categoryLabels.custom;
          return (
            <div
              key={template.id}
              className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cat.bgColor} ${cat.color}`}>
                    {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewId(template.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {template.name}
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Subject: {template.subject}
              </p>
              <p className="text-sm text-slate-500 line-clamp-3">
                {template.body.slice(0, 150)}...
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span>
                  Merge fields:{" "}
                  {template.merge_fields.map((f) => `{{${f}}}`).join(", ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Template Preview
              </h2>
              <button
                onClick={() => setPreviewId(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-[#0d1526] p-6">
              <div className="mb-4 border-b border-slate-700/50 pb-4">
                <p className="text-xs text-slate-500 mb-1">From: The Finishing Touch &lt;hello@thefinishingtouchllc.com&gt;</p>
                <p className="text-xs text-slate-500 mb-1">To: {"{{first_name}}"} &lt;customer@email.com&gt;</p>
                <p className="text-sm font-medium text-slate-200">
                  Subject: {previewTemplate.subject}
                </p>
              </div>
              <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                {previewTemplate.body}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
