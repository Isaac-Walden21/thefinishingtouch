"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Phone, Mail, MapPin, Filter } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import Select from "@/components/ui/Select";
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

  // Pre-compute lead data per customer (fix #15)
  const customerLeadData = useMemo(() => {
    const map = new Map<string, { count: number; latestStatus: string | null }>();
    for (const customer of demoCustomers) {
      const customerLeads = demoLeads.filter((l) => l.customer_id === customer.id);
      const sorted = [...customerLeads].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      map.set(customer.id, {
        count: customerLeads.length,
        latestStatus: sorted[0]?.status ?? null,
      });
    }
    return map;
  }, []);

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

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Customers"
        subtitle={`${demoCustomers.length} total customers`}
        action={
          <Button href="/customers/new">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, phone, or city..."
          className="flex-1 min-w-[280px] max-w-md"
        />
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="!w-auto">
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="!w-auto">
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((customer) => {
          const data = customerLeadData.get(customer.id);
          const statusConfig = data?.latestStatus
            ? LEAD_STATUS_CONFIG[data.latestStatus as keyof typeof LEAD_STATUS_CONFIG]
            : null;
          return (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block rounded-xl border border-slate-200 bg-surface p-4 shadow-sm hover:border-brand/30"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-brand">{customer.name}</p>
                {statusConfig && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                )}
              </div>
              {customer.phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </div>
              )}
              {customer.city && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" />
                  {customer.city}, {customer.state}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block rounded-xl border border-slate-200 bg-surface shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Location</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Service</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Leads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((customer) => {
              const data = customerLeadData.get(customer.id);
              const statusConfig = data?.latestStatus
                ? LEAD_STATUS_CONFIG[data.latestStatus as keyof typeof LEAD_STATUS_CONFIG]
                : null;
              return (
                <tr key={customer.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-brand hover:text-brand-hover">
                      {customer.name}
                    </Link>
                    {customer.source && (
                      <p className="mt-0.5 text-xs text-slate-500">via {customer.source}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {customer.city}, {customer.state}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-600">{customer.service_type}</span>
                  </td>
                  <td className="px-6 py-4">
                    {statusConfig && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{data?.count ?? 0}</span>
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
