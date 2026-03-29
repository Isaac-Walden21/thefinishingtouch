"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Edit3,
  Copy,
  X,
  Send,
  Monitor,
  Smartphone,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { demoEmailTemplates } from "@/lib/demo-data";
import type { EmailBlock } from "@/lib/types";
import EmailBuilder from "@/components/EmailBuilder";

const MARKETING_TABS = [
  { href: "/marketing/contacts", label: "Contacts" },
  { href: "/marketing/templates", label: "Templates" },
  { href: "/marketing/campaigns", label: "Campaigns" },
  { href: "/marketing/automations", label: "Automations" },
  { href: "/marketing/referrals", label: "Referrals" },
];

const categoryLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  seasonal_promo: { label: "Seasonal Promo", color: "text-orange-600", bgColor: "bg-orange-50" },
  new_service: { label: "New Service", color: "text-[#0085FF]", bgColor: "bg-[#0085FF]/10" },
  project_showcase: { label: "Project Showcase", color: "text-purple-600", bgColor: "bg-purple-50" },
  review_request: { label: "Review Request", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  referral: { label: "Referral Program", color: "text-rose-600", bgColor: "bg-rose-50" },
  custom: { label: "Custom", color: "text-slate-500", bgColor: "bg-slate-100" },
};

export default function MarketingTemplatesPage() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [builderBlocks, setBuilderBlocks] = useState<EmailBlock[]>([
    { id: "b-1", type: "header", content: { banner_text: "The Finishing Touch LLC" } },
    { id: "b-2", type: "text", content: { content: "Hi {{first_name}},\n\nWe wanted to reach out about..." } },
    { id: "b-3", type: "button", content: { text: "Get a Free Quote", url: "https://thefinishingtouchllc.com", color: "#0085FF" } },
    { id: "b-4", type: "footer", content: { text: "The Finishing Touch LLC | Greentown, IN", unsubscribe: "{{unsubscribe_link}}" } },
  ]);

  const previewTemplate = previewId ? demoEmailTemplates.find((t) => t.id === previewId) : null;

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>Email Templates</h1>
          <p className="mt-1 text-sm text-slate-500">Pre-built and custom templates for your campaigns.</p>
        </div>
        <button onClick={() => setShowBuilder(!showBuilder)} className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]">
          <Edit3 className="h-4 w-4" /> {showBuilder ? "View Templates" : "New Template"}
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {MARKETING_TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={clsx("rounded-md px-4 py-2 text-sm font-medium transition-colors", tab.href === "/marketing/templates" ? "bg-[#0085FF]/10 text-[#0085FF]" : "text-slate-500 hover:text-slate-700")}>
            {tab.label}
          </Link>
        ))}
      </div>

      {showBuilder ? (
        /* Visual Email Builder */
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <input type="text" placeholder="Template Name" className="text-lg font-semibold text-[#0F172A] border-none outline-none placeholder:text-slate-300" />
              <input type="text" placeholder="Subject Line" className="mt-1 block text-sm text-slate-500 border-none outline-none placeholder:text-slate-300" />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
                <Send className="h-3 w-3" /> Send Test
              </button>
              <button className="rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0177E3]">
                Save Template
              </button>
            </div>
          </div>
          <EmailBuilder
            blocks={builderBlocks}
            onChange={setBuilderBlocks}
            onSendTest={() => alert("Test email would be sent")}
          />
        </div>
      ) : (
        /* Template Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {demoEmailTemplates.map((template) => {
            const cat = categoryLabels[template.category] ?? categoryLabels.custom;
            return (
              <div key={template.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cat.bgColor} ${cat.color}`}>{cat.label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewId(template.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Preview">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Edit">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-1">{template.name}</h3>
                <p className="text-xs text-slate-500 mb-3">Subject: {template.subject}</p>
                <p className="text-sm text-slate-500 line-clamp-3">{template.body.slice(0, 150)}...</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Fields: {template.merge_fields.map((f) => `{{${f}}}`).join(", ")}</span>
                  <Link href={`/marketing/campaigns?template=${template.id}`} className="text-xs text-[#0085FF] hover:underline">
                    Use in Campaign
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#0F172A]">Template Preview</h2>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 p-0.5">
                  <button onClick={() => setMobilePreview(false)} className={clsx("rounded-md p-1.5", !mobilePreview ? "bg-[#0085FF] text-white" : "text-slate-400")}>
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button onClick={() => setMobilePreview(true)} className={clsx("rounded-md p-1.5", mobilePreview ? "bg-[#0085FF] text-white" : "text-slate-400")}>
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={() => setPreviewId(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className={clsx("mx-auto rounded-lg border border-slate-200 bg-slate-50 p-6", mobilePreview ? "max-w-xs" : "")}>
              <div className="mb-4 border-b border-slate-200 pb-4">
                <p className="text-xs text-slate-500 mb-1">From: The Finishing Touch &lt;evan@thefinishingtouchllc.com&gt;</p>
                <p className="text-xs text-slate-500 mb-1">To: {"{{first_name}}"} &lt;customer@email.com&gt;</p>
                <p className="text-sm font-medium text-slate-700">Subject: {previewTemplate.subject}</p>
              </div>
              <div className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">{previewTemplate.body}</div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <Send className="mr-1.5 inline h-3.5 w-3.5" /> Send Test
              </button>
              <Link href={`/marketing/campaigns?template=${previewTemplate.id}`} className="rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0177E3]">
                Use in Campaign
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
