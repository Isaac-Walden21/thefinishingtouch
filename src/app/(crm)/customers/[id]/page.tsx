"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Copy,
  ExternalLink,
  MessageSquare,
  CalendarPlus,
  Calculator,
  FileText,
  StickyNote,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  AlertTriangle,
  DollarSign,
  Briefcase,
  TrendingUp,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import ActivityTimeline from "@/components/ActivityTimeline";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import {
  demoCustomers,
  demoLeads,
  demoActivities,
  demoEstimates,
  demoInvoices,
} from "@/lib/demo-data";
import {
  LEAD_STATUS_CONFIG,
  ESTIMATE_STATUS_CONFIG,
  INVOICE_STATUS_CONFIG,
  type ActivityType,
} from "@/lib/types";
import { formatCurrency, formatDate, formatTimeAgo } from "@/lib/format";

const ACTIVITY_TYPES = [
  { id: "all", label: "All" },
  { id: "call", label: "Calls" },
  { id: "email", label: "Emails" },
  { id: "quote", label: "Quotes" },
  { id: "payment", label: "Payments" },
  { id: "note", label: "Notes" },
  { id: "ai_action", label: "AI" },
];

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customer = demoCustomers.find((c) => c.id === id);
  const customerLeads = demoLeads.filter((l) => l.customer_id === id);
  const customerActivities = demoActivities.filter((a) => a.customer_id === id);
  const customerEstimates = demoEstimates.filter((e) => e.customer_id === id);
  const customerInvoices = demoInvoices.filter((i) => i.customer_id === id);

  const [activityFilter, setActivityFilter] = useState("all");
  const [addActivityType, setAddActivityType] = useState<"call" | "email" | "note">("note");
  const [activityDescription, setActivityDescription] = useState("");
  const [tags, setTags] = useState<string[]>(["Residential"]);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [leadsOpen, setLeadsOpen] = useState(true);
  const [estimatesOpen, setEstimatesOpen] = useState(true);
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [visionOpen, setVisionOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  if (!customer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-500">Customer not found</p>
          <Link
            href="/customers"
            className="mt-4 inline-flex items-center gap-2 text-sm text-brand hover:text-brand-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </Link>
        </div>
      </div>
    );
  }

  // Stats
  const totalRevenue = customerInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((s, inv) => s + inv.total, 0);
  const jobsCompleted = customerLeads.filter((l) => l.status === "completed").length;
  const avgJobSize = jobsCompleted > 0 ? Math.round(totalRevenue / jobsCompleted) : 0;
  const customerSince = new Date(customer.created_at);
  const daysSince = Math.floor(
    (Date.now() - customerSince.getTime()) / 86400000
  );

  const filteredActivities =
    activityFilter === "all"
      ? customerActivities
      : customerActivities.filter((a) => a.type === activityFilter);

  const initials = customer.name
    .split(" ")
    .filter((w) => w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const googleMapsUrl = customer.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip}`
      )}`
    : null;

  function addTag() {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    setNewTag("");
    setShowTagInput(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        backHref="/customers"
        backLabel="Back to customers"
        title=""
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-foreground">
                  {customer.name}
                </h1>
                {customer.service_type && (
                  <p className="text-sm text-slate-500">{customer.service_type}</p>
                )}
                <div className="mt-3 space-y-2">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-sm text-brand hover:underline"
                      >
                        {customer.phone}
                      </a>
                      <button
                        onClick={() => copyToClipboard(customer.phone!)}
                        className="text-slate-300 hover:text-slate-500"
                        title="Copy"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-sm text-brand hover:underline"
                      >
                        {customer.email}
                      </a>
                      <button
                        onClick={() => copyToClipboard(customer.email!)}
                        className="text-slate-300 hover:text-slate-500"
                        title="Copy"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                      {googleMapsUrl ? (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand hover:underline"
                        >
                          {customer.address}, {customer.city}, {customer.state}{" "}
                          {customer.zip}
                          <ExternalLink className="ml-1 inline h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-slate-600">
                          {customer.address}, {customer.city}, {customer.state}{" "}
                          {customer.zip}
                        </span>
                      )}
                    </div>
                  )}
                  {customer.source && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        Source: {customer.source}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      Customer since{" "}
                      {customerSince.toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand"
                    >
                      {tag}
                      <button
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="hover:text-red-500"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {showTagInput ? (
                    <input
                      autoFocus
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTag();
                        if (e.key === "Escape") setShowTagInput(false);
                      }}
                      onBlur={addTag}
                      placeholder="Tag name..."
                      className="rounded-full border border-brand px-2.5 py-0.5 text-xs text-slate-700 focus:outline-none w-24"
                    />
                  ) : (
                    <button
                      onClick={() => setShowTagInput(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-400 hover:border-brand hover:text-brand"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      Add tag
                    </button>
                  )}
                </div>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Notes</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {customer.notes}
                </p>
              </div>
            )}
          </div>

          {/* Lifetime Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "Total Revenue",
                value: formatCurrency(totalRevenue) ?? "$0",
                icon: DollarSign,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Jobs Completed",
                value: String(jobsCompleted),
                icon: Briefcase,
                color: "text-brand",
                bg: "bg-brand/10",
              },
              {
                label: "Avg Job Size",
                value: formatCurrency(avgJobSize) ?? "$0",
                icon: TrendingUp,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                label: "Customer Since",
                value: `${daysSince} days`,
                icon: Clock,
                color: "text-orange-600",
                bg: "bg-orange-50",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className={clsx("rounded-lg p-2", stat.bg)}>
                    <stat.icon className={clsx("h-4 w-4", stat.color)} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                </div>
                <p className="mt-2 text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Activity History
            </h2>

            {/* Filter */}
            <div className="mb-4 overflow-x-auto">
              <Tabs
                tabs={ACTIVITY_TYPES.map((t) => ({
                  id: t.id,
                  label: t.label,
                  count:
                    t.id === "all"
                      ? customerActivities.length
                      : customerActivities.filter((a) => a.type === t.id).length,
                }))}
                activeTab={activityFilter}
                onChange={setActivityFilter}
              />
            </div>

            {/* Add Activity */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <select
                  value={addActivityType}
                  onChange={(e) =>
                    setAddActivityType(e.target.value as "call" | "email" | "note")
                  }
                  className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 focus:border-brand focus:outline-none"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="note">Note</option>
                </select>
                <input
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Describe what happened..."
                  className="flex-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none"
                />
                <button
                  disabled={!activityDescription.trim()}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <ActivityTimeline activities={filteredActivities} />
          </div>

          {/* Collapsible Sections */}
          {/* Leads */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setLeadsOpen(!leadsOpen)}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Leads ({customerLeads.length})
              </h2>
              {leadsOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {leadsOpen && (
              <div className="border-t border-slate-200 px-6 py-4">
                {customerLeads.length === 0 ? (
                  <p className="text-sm text-slate-500">No leads yet.</p>
                ) : (
                  <div className="space-y-3">
                    {customerLeads.map((lead) => {
                      const sc = LEAD_STATUS_CONFIG[lead.status];
                      return (
                        <Link
                          key={lead.id}
                          href={`/leads/${lead.id}`}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-brand/30"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {lead.project_type}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatDate(lead.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {lead.quoted_amount !== null && (
                              <span className="text-sm font-medium text-emerald-600">
                                {formatCurrency(lead.quoted_amount)}
                              </span>
                            )}
                            <Badge label={sc.label} color={sc.color} bgColor={sc.bgColor} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
                <Link
                  href={`/customers/new?customer_id=${id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Lead
                </Link>
              </div>
            )}
          </div>

          {/* Estimates */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setEstimatesOpen(!estimatesOpen)}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Estimates ({customerEstimates.length})
              </h2>
              {estimatesOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {estimatesOpen && (
              <div className="border-t border-slate-200 px-6 py-4">
                {customerEstimates.length === 0 ? (
                  <p className="text-sm text-slate-500">No estimates yet.</p>
                ) : (
                  <div className="space-y-3">
                    {customerEstimates.map((est) => {
                      const sc = ESTIMATE_STATUS_CONFIG[est.status];
                      return (
                        <Link
                          key={est.id}
                          href={`/estimates/${est.id}`}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-brand/30"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {est.project_type}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatDate(est.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">
                              {formatCurrency(est.total)}
                            </span>
                            <Badge label={sc.label} color={sc.color} bgColor={sc.bgColor} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
                <Link
                  href={`/estimates/new?customer=${id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Estimate
                </Link>
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setInvoicesOpen(!invoicesOpen)}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Invoices ({customerInvoices.length})
              </h2>
              {invoicesOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {invoicesOpen && (
              <div className="border-t border-slate-200 px-6 py-4">
                {customerInvoices.length === 0 ? (
                  <p className="text-sm text-slate-500">No invoices yet.</p>
                ) : (
                  <div className="space-y-3">
                    {customerInvoices.map((inv) => {
                      const sc = INVOICE_STATUS_CONFIG[inv.status];
                      return (
                        <Link
                          key={inv.id}
                          href={`/invoices/${inv.id}`}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-brand/30"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {inv.invoice_number}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Due {formatDate(inv.due_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">
                              {formatCurrency(inv.total)}
                            </span>
                            <Badge label={sc.label} color={sc.color} bgColor={sc.bgColor} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
                <Link
                  href={`/invoices/new?customer=${id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Invoice
                </Link>
              </div>
            )}
          </div>

          {/* Vision Projects */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setVisionOpen(!visionOpen)}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-sm font-semibold text-foreground">
                Vision Projects (0)
              </h2>
              {visionOpen ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {visionOpen && (
              <div className="border-t border-slate-200 px-6 py-4">
                <p className="text-sm text-slate-500">No vision projects yet.</p>
              </div>
            )}
          </div>

          {/* Archive */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
            </div>
            <p className="text-sm text-red-600 mb-4">
              Archiving this customer will hide them from active lists. Their data will be preserved.
            </p>
            <button
              onClick={() => setArchiveModalOpen(true)}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Archive Customer
            </button>
          </div>
        </div>

        {/* Quick Actions Sidebar (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-8 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {customer.phone && (
                  <>
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-brand/30 hover:text-brand"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                    <a
                      href={`sms:${customer.phone}`}
                      className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-brand/30 hover:text-brand"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Text
                    </a>
                  </>
                )}
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-brand/30 hover:text-brand"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
                <button className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-brand/30 hover:text-brand">
                  <CalendarPlus className="h-4 w-4" />
                  Schedule Visit
                </button>
                <Link
                  href={`/estimates/new?customer=${id}`}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-brand/30 hover:text-brand"
                >
                  <Calculator className="h-4 w-4" />
                  Create Estimate
                </Link>
                <Link
                  href={`/invoices/new?customer=${id}`}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition-colors hover:border-brand/30 hover:text-brand"
                >
                  <FileText className="h-4 w-4" />
                  Create Invoice
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Quick Actions (sticky bottom) */}
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center gap-2 border-t border-slate-200 bg-white p-3 lg:hidden">
          {customer.phone && (
            <>
              <a
                href={`tel:${customer.phone}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-xs font-medium text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
              <a
                href={`sms:${customer.phone}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-xs font-medium text-slate-600"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Text
              </a>
            </>
          )}
          <Link
            href={`/estimates/new?customer=${id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-xs font-medium text-slate-600"
          >
            <Calculator className="h-3.5 w-3.5" />
            Estimate
          </Link>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      <Modal
        open={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        title="Archive Customer"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-4">
          This will archive <strong>{customer.name}</strong> and hide them from
          active lists. Their data will be preserved. Continue?
        </p>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
            onClick={() => setArchiveModalOpen(false)}
          >
            Archive
          </button>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={() => setArchiveModalOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
