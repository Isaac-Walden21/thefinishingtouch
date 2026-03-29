"use client";

import { useState } from "react";
import { Upload, Check } from "lucide-react";
import type { CompanySettings } from "@/lib/types";

interface CompanyProfileProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

export default function CompanyProfile({ settings, onSave }: CompanyProfileProps) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const update = (field: keyof CompanySettings, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    onSave(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        {/* Logo upload */}
        <div className="flex-shrink-0">
          <label className={labelClass}>Company Logo</label>
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-[#0085FF]/30 cursor-pointer">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="h-full w-full rounded-xl object-contain" />
            ) : (
              <Upload className="h-6 w-6 text-slate-400" />
            )}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">PNG, JPG, SVG</p>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <label className={labelClass}>Company Name</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => update("company_name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Street Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>ZIP</label>
          <input
            type="text"
            value={form.zip}
            onChange={(e) => update("zip", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Website</label>
        <input
          type="url"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Google Review URL</label>
        <input
          type="url"
          value={form.google_review_url}
          onChange={(e) => update("google_review_url", e.target.value)}
          placeholder="https://g.page/..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Service Area</label>
        <input
          type="text"
          value={form.service_area}
          onChange={(e) => update("service_area", e.target.value)}
          placeholder="e.g. Howard County, IN and surrounding areas"
          className={inputClass}
        />
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          Changes saved
        </div>
      )}
    </div>
  );
}
