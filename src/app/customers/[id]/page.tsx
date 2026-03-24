"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
} from "lucide-react";
import ActivityTimeline from "@/components/ActivityTimeline";
import { demoCustomers, demoLeads, demoActivities } from "@/lib/demo-data";
import { LEAD_STATUS_CONFIG } from "@/lib/types";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const customer = demoCustomers.find((c) => c.id === id);
  const customerLeads = demoLeads.filter((l) => l.customer_id === id);
  const customerActivities = demoActivities.filter(
    (a) => a.customer_id === id
  );

  if (!customer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-400">Customer not found</p>
          <Link
            href="/customers"
            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/customers"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Customer Info Card */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                {customer.name
                  .split(" ")
                  .filter((w) => w[0] === w[0].toUpperCase())
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {customer.name}
                </h1>
                {customer.service_type && (
                  <p className="text-sm text-slate-400">
                    {customer.service_type}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {customer.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-slate-500" />
                  <span className="text-slate-300">
                    {customer.address}
                    <br />
                    {customer.city}, {customer.state} {customer.zip}
                  </span>
                </div>
              )}
              {customer.source && (
                <div className="flex items-center gap-3 text-sm">
                  <Tag className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">
                    Source: {customer.source}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-slate-300">
                  Customer since{" "}
                  {new Date(customer.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Notes
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {customer.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Leads + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leads */}
          <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Leads ({customerLeads.length})
            </h2>
            {customerLeads.length === 0 ? (
              <p className="text-sm text-slate-500">
                No leads for this customer yet.
              </p>
            ) : (
              <div className="space-y-3">
                {customerLeads.map((lead) => {
                  const statusConfig = LEAD_STATUS_CONFIG[lead.status];
                  return (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-[#0d1526] p-4 transition-colors hover:border-slate-600"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {lead.project_type}
                        </p>
                        {lead.project_description && (
                          <p className="mt-1 text-xs text-slate-500 max-w-md truncate">
                            {lead.project_description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {lead.quoted_amount && (
                          <span className="text-sm font-medium text-emerald-400">
                            ${lead.quoted_amount.toLocaleString()}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">
              Activity History
            </h2>
            <ActivityTimeline activities={customerActivities} />
          </div>
        </div>
      </div>
    </div>
  );
}
