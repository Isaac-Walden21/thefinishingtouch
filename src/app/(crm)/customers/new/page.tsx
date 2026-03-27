"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const serviceTypes = [
  "Concrete Patio",
  "Driveway",
  "Post Frame",
  "Landscaping",
  "Curbing",
  "Sidewalk",
  "Stamped Concrete",
  "Firewood",
  "Other",
];

const sources = [
  "Google",
  "Facebook",
  "Website",
  "Referral",
  "Yard Sign",
  "Phone Call",
  "Other",
];

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    // Demo mode - simulate save
    setTimeout(() => {
      router.push("/customers");
    }, 500);
  }

  return (
    <div className="p-8">
      <Link
        href="/customers"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
          Add New Customer
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Create a new customer profile and optionally add a lead.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Info */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Steve & Linda Morales"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(765) 555-0000"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="1234 Main St"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="Greentown"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    defaultValue="IN"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ZIP
                  </label>
                  <input
                    type="text"
                    name="zip"
                    placeholder="46936"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service Type
                </label>
                <select
                  name="service_type"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                >
                  <option value="">Select a service...</option>
                  {serviceTypes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lead Source
                </label>
                <select
                  name="source"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                >
                  <option value="">Select a source...</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Any notes about this customer..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Lead Info */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">
              Lead Details (Optional)
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Type
                </label>
                <input
                  type="text"
                  name="project_type"
                  placeholder="e.g. Stamped Concrete Patio"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quoted Amount
                </label>
                <input
                  type="number"
                  name="quoted_amount"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Description
                </label>
                <textarea
                  name="project_description"
                  rows={3}
                  placeholder="Describe the project scope, dimensions, materials, etc."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Customer"}
            </button>
            <Link
              href="/customers"
              className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
