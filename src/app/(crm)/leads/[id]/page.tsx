"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  User,
  Calendar,
  ChevronDown,
} from "lucide-react";
import ActivityTimeline from "@/components/ActivityTimeline";
import {
  demoLeads,
  demoCustomers,
  demoActivities,
  demoTeam,
} from "@/lib/demo-data";
import { LEAD_STATUS_CONFIG, PIPELINE_STAGES } from "@/lib/types";
import type { LeadStatus } from "@/lib/types";

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const lead = demoLeads.find((l) => l.id === id);
  const customer = lead
    ? demoCustomers.find((c) => c.id === lead.customer_id)
    : null;
  const activities = demoActivities.filter((a) => a.lead_id === id);
  const assignee = lead
    ? demoTeam.find((t) => t.id === lead.assigned_to)
    : null;

  const [status, setStatus] = useState<LeadStatus>(
    lead?.status ?? "new"
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  if (!lead || !customer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-500">Lead not found</p>
          <Link
            href="/leads"
            className="mt-4 inline-flex items-center gap-2 text-sm text-[#0085FF] hover:text-[#0177E3]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to pipeline
          </Link>
        </div>
      </div>
    );
  }

  const config = LEAD_STATUS_CONFIG[status];

  return (
    <div className="p-8">
      <Link
        href="/leads"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to pipeline
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-[#0F172A]">
                  {lead.project_type}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {customer.name}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${config.bgColor} ${config.color}`}
                >
                  {config.label}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showStatusDropdown && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                    {PIPELINE_STAGES.map((s) => {
                      const sc = LEAD_STATUS_CONFIG[s];
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            setStatus(s);
                            setShowStatusDropdown(false);
                          }}
                          className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 ${
                            s === status ? sc.color : "text-slate-600"
                          }`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${sc.bgColor.replace("/20", "")}`}
                          />
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {lead.quoted_amount && (
              <div className="mt-4 flex items-center gap-2 text-2xl font-bold text-emerald-600">
                <DollarSign className="h-6 w-6" />
                {lead.quoted_amount.toLocaleString()}
              </div>
            )}

            {lead.project_description && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-500">
                  Project Description
                </h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  {lead.project_description}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              {assignee && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Assigned to {assignee.name}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Created{" "}
                {new Date(lead.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="mb-6 text-lg font-semibold text-[#0F172A]">
              Activity Timeline
            </h2>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Sidebar - Customer Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">
              Customer Info
            </h2>
            <div className="space-y-4">
              <Link
                href={`/customers/${customer.id}`}
                className="block text-base font-medium text-[#0085FF] hover:text-[#0177E3]"
              >
                {customer.name}
              </Link>

              {customer.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{customer.phone}</span>
                </div>
              )}

              {customer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{customer.email}</span>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span className="text-slate-600">
                    {customer.address}
                    <br />
                    {customer.city}, {customer.state} {customer.zip}
                  </span>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Notes
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {customer.notes}
                </p>
              </div>
            )}

            {customer.source && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-500 mb-1">
                  Source
                </h3>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {customer.source}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
