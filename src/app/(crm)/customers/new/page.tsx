"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
  Upload,
  Flame,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/PageHeader";
import { Toggle } from "@/components/ui/Toggle";
import type { Customer, TeamMember } from "@/lib/types";
import { formatPhone, stripPhone } from "@/lib/format";

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
  "Vapi",
  "Other",
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const labelClass = "block text-sm font-medium text-slate-700 mb-2";
const errorClass = "mt-1 text-xs text-red-500";

interface DuplicateMatch {
  id: string;
  name: string;
  phone: string | null;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allTeam, setAllTeam] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [highPriority, setHighPriority] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("IN");
  const [zip, setZip] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [source, setSource] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [notes, setNotes] = useState("");
  const [projectType, setProjectType] = useState("");
  const [quotedAmount, setQuotedAmount] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/team-members').then(r => r.json()),
    ])
      .then(([customersData, teamData]) => {
        setAllCustomers(customersData);
        setAllTeam(teamData);
      })
      .catch(console.error);
  }, []);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [saved, setSaved] = useState(false);

  function formatPhoneInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6)
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function handlePhoneChange(value: string) {
    const formatted = formatPhoneInput(value);
    setPhone(formatted);
  }

  const checkDuplicates = useCallback(
    (checkName: string, checkPhone: string) => {
      const matches: DuplicateMatch[] = [];
      const cleanPhone = stripPhone(checkPhone);

      allCustomers.forEach((c) => {
        const cPhone = c.phone ? stripPhone(c.phone) : "";
        const phoneMatch = cleanPhone.length >= 10 && cPhone === cleanPhone;
        const nameMatch =
          checkName.length > 2 &&
          c.name.toLowerCase().includes(checkName.toLowerCase());
        if (phoneMatch || nameMatch) {
          matches.push({ id: c.id, name: c.name, phone: c.phone });
        }
      });

      setDuplicates(matches);
      setShowDuplicateWarning(matches.length > 0);
    },
    []
  );

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (phone) {
      const digits = stripPhone(phone);
      if (digits.length > 0 && digits.length !== 10)
        errs.phone = "Phone must be 10 digits";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Invalid email format";
    if (quotedAmount && (isNaN(Number(quotedAmount)) || Number(quotedAmount) < 0))
      errs.quotedAmount = "Must be a positive number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: stripPhone(phone),
          email,
          address,
          city,
          state,
          zip,
          service_type: serviceType,
          source,
          assigned_to: assignTo || null,
          notes,
        }),
      });
      if (res.ok) {
        setSaved(true);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  function handleAddAnother() {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCity("");
    setState("IN");
    setZip("");
    setServiceType("");
    setSource("");
    setAssignTo("");
    setNotes("");
    setProjectType("");
    setQuotedAmount("");
    setProjectDescription("");
    setHighPriority(false);
    setErrors({});
    setDuplicates([]);
    setShowDuplicateWarning(false);
    setSaved(false);
    setShowFullForm(false);
  }

  if (saved) {
    return (
      <div className="p-4 pt-16 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Save className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Customer Saved
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            {name} has been added successfully.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/customers/c-1"
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
            >
              View Customer
            </Link>
            <button
              onClick={handleAddAnother}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        backHref="/customers"
        backLabel="Back to customers"
        title="Add New Customer"
        subtitle="Create a new customer profile and optionally add a lead."
      />

      <div className="max-w-3xl">
        {/* Duplicate Warning */}
        {showDuplicateWarning && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Possible duplicate detected
                </p>
                {duplicates.map((d) => (
                  <p key={d.id} className="mt-1 text-sm text-amber-700">
                    <strong>{d.name}</strong>
                    {d.phone && ` - ${d.phone}`}
                  </p>
                ))}
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={`/customers/${duplicates[0]?.id}`}
                    target="_blank"
                    className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 underline"
                  >
                    View existing record
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => setShowDuplicateWarning(false)}
                    className="text-sm font-medium text-amber-600 hover:text-amber-800"
                  >
                    Create anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Add */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {showFullForm ? "Customer Information" : "Quick Add"}
              </h2>
              {highPriority && (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500">
                  <Flame className="h-3 w-3" />
                  High Priority
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => checkDuplicates(name, phone)}
                  placeholder="e.g. Steve & Linda Morales"
                  className={clsx(inputClass, errors.name && "border-red-300")}
                />
                {errors.name && <p className={errorClass}>{errors.name}</p>}
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => checkDuplicates(name, phone)}
                  placeholder="(765) 555-0000"
                  className={clsx(inputClass, errors.phone && "border-red-300")}
                />
                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
              </div>
              <div>
                <label className={labelClass}>Project Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className={clsx(inputClass, "appearance-auto")}
                >
                  <option value="">Select a service...</option>
                  {serviceTypes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggle full form */}
            <button
              type="button"
              onClick={() => setShowFullForm(!showFullForm)}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-hover"
            >
              {showFullForm ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {showFullForm ? "Hide full form" : "Show full form"}
            </button>

            {/* Full form fields */}
            {showFullForm && (
              <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={clsx(inputClass, errors.email && "border-red-300")}
                  />
                  {errors.email && <p className={errorClass}>{errors.email}</p>}
                </div>
                <div>
                  <label className={labelClass}>Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className={clsx(inputClass, "appearance-auto")}
                  >
                    <option value="">Select a source...</option>
                    {sources.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Start typing for autocomplete..."
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Google Places autocomplete{" "}
                    {process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
                      ? "enabled"
                      : "(API key not configured)"}
                  </p>
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Greentown"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ZIP</label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="46936"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Assign To</label>
                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    className={clsx(inputClass, "appearance-auto")}
                  >
                    <option value="">Select team member...</option>
                    {allTeam
                      .filter((t) => t.is_active)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} -- {t.role}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <Toggle
                    checked={highPriority}
                    onChange={setHighPriority}
                    label="High Priority"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Any notes about this customer..."
                    className={clsx(inputClass, "resize-none")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lead Details (shown in full form) */}
          {showFullForm && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Lead Details (Optional)
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Project Type</label>
                  <input
                    type="text"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    placeholder="e.g. Stamped Concrete Patio with Fire Pit"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Quoted Amount</label>
                  <input
                    type="number"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={clsx(inputClass, errors.quotedAmount && "border-red-300")}
                  />
                  {errors.quotedAmount && (
                    <p className={errorClass}>{errors.quotedAmount}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Project Description</label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the project scope, dimensions, materials, etc."
                    className={clsx(inputClass, "resize-none")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Photo Upload</label>
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 transition-colors hover:border-brand/30">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">
                        Drag and drop photos or click to browse
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        PNG, JPG up to 10MB each
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
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
