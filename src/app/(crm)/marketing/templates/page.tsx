"use client";

import { useState } from "react";
import { Eye, Edit3, Copy, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import MarketingNav from "@/components/ui/MarketingNav";
import { demoEmailTemplates } from "@/lib/demo-data";

const categoryLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  seasonal_promo: { label: "Seasonal Promo", color: "text-orange-600", bgColor: "bg-orange-50" },
  new_service: { label: "New Service", color: "text-brand", bgColor: "bg-brand/10" },
  project_showcase: { label: "Project Showcase", color: "text-purple-600", bgColor: "bg-purple-50" },
  review_request: { label: "Review Request", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  custom: { label: "Custom", color: "text-slate-500", bgColor: "bg-slate-100" },
};

export default function MarketingTemplatesPage() {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewTemplate = previewId ? demoEmailTemplates.find((t) => t.id === previewId) : null;

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Email Templates"
        subtitle="Pre-built and custom templates for your campaigns."
        action={
          <Button>
            <Edit3 className="h-4 w-4" />
            New Template
          </Button>
        }
      />

      <MarketingNav />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {demoEmailTemplates.map((template) => {
          const cat = categoryLabels[template.category] ?? categoryLabels.custom;
          return (
            <div key={template.id} className="rounded-xl border border-slate-200 bg-surface shadow-sm p-6">
              <div className="flex items-start justify-between mb-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cat.bgColor} ${cat.color}`}>{cat.label}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPreviewId(template.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Eye className="h-4 w-4" /></button>
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Copy className="h-4 w-4" /></button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{template.name}</h3>
              <p className="text-xs text-slate-500 mb-3">Subject: {template.subject}</p>
              <p className="text-sm text-slate-500 line-clamp-3">{template.body.slice(0, 150)}...</p>
              <div className="mt-4 text-xs text-slate-400">
                Merge fields: {template.merge_fields.map((f) => `{{${f}}}`).join(", ")}
              </div>
            </div>
          );
        })}
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-surface shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Template Preview</h2>
              <button onClick={() => setPreviewId(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 border-b border-slate-200 pb-4">
                <p className="text-xs text-slate-500 mb-1">From: The Finishing Touch &lt;hello@thefinishingtouchllc.com&gt;</p>
                <p className="text-xs text-slate-500 mb-1">To: {"{{first_name}}"} &lt;customer@email.com&gt;</p>
                <p className="text-sm font-medium text-slate-700">Subject: {previewTemplate.subject}</p>
              </div>
              <div className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">{previewTemplate.body}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
