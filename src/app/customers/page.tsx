"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Phone, Mail, MapPin, Filter } from "lucide-react";
import { demoCustomers, demoLeads } from "@/lib/demo-data";
import { LEAD_STATUS_CONFIG } from "@/lib/types";

const serviceTypes = [
  "All Services",
  "Concrete Patio",
  "Driveway",
  "Post Frame",
  "Landscaping",
  "Curbing",
];
const sources = [
  "All Sources",
  "Google",
  "Facebook",
  "Website",
  "Referral",
  "Yard Sign",
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All Services");
  const [sourceFilter, setSourceFilter] = useState("All Sources");

  const filtered = demoCustomers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.city?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (serviceFilter !== "All Services" && c.service_type !== serviceFilter)
      return false;
    if (sourceFilter !== "All Sources" && c.source !== sourceFilter)
      return false;
    return true;
  });

  function getCustomerLeadCount(customerId: string) {
    return demoLeads.filter((l) => l.customer_id === customerId).length;
  }

  function getLatestLeadStatus(customerId: string) {
    const customerLeads = demoLeads
      .filter((l) => l.customer_id === customerId)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    return customerLeads[0]?.status ?? null;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="mt-1 text-sm text-slate-400">
            {demoCustomers.length} total customers
          </p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700/50 bg-[#111a2e] py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-lg border border-slate-700/50 bg-[#111a2e] px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            {serviceTypes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-slate-700/50 bg-[#111a2e] px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Location
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Service
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                Leads
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filtered.map((customer) => {
              const latestStatus = getLatestLeadStatus(customer.id);
              const statusConfig = latestStatus
                ? LEAD_STATUS_CONFIG[latestStatus]
                : null;
              return (
                <tr
                  key={customer.id}
                  className="transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      {customer.name}
                    </Link>
                    {customer.source && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        via {customer.source}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {customer.city}, {customer.state}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-300">
                      {customer.service_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {statusConfig && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-300">
                      {getCustomerLeadCount(customer.id)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">
            No customers match your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
