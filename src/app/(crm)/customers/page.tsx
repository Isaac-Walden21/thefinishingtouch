"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Filter,
  Download,
  MessageSquare,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Merge,
  Tag,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LEAD_STATUS_CONFIG, type Customer, type Lead, type Invoice, type Activity } from "@/lib/types";
import { formatCurrency, formatDaysAgo, formatDate } from "@/lib/format";

type SortKey = "name" | "city" | "service_type" | "status" | "leads" | "lifetime_value" | "last_contact";
type SortDir = "asc" | "desc";

const serviceTypes = [
  "Concrete Patio",
  "Driveway",
  "Post Frame",
  "Landscaping",
  "Curbing",
  "Stamped Concrete",
];
const sources = ["Google", "Facebook", "Website", "Referral", "Yard Sign"];

// Demo tags
const demoTags: Record<string, string[]> = {
  "c-1": ["VIP", "Repeat Customer"],
  "c-3": ["Commercial"],
  "c-7": ["VIP"],
  "c-8": ["Commercial"],
  "c-11": ["Commercial"],
};

export default function CustomersPage() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    customerId: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [tags, setTags] = useState<Record<string, string[]>>(demoTags);

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/activities').then(r => r.json()),
    ])
      .then(([customersData, leadsData, invoicesData, activitiesData]) => {
        setAllCustomers(customersData);
        setAllLeads(leadsData);
        setAllInvoices(invoicesData);
        setAllActivities(activitiesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Computed data
  const lifetimeValues = useMemo(() => {
    const map = new Map<string, number>();
    allInvoices
      .filter((inv) => inv.status === "paid")
      .forEach((inv) => {
        map.set(inv.customer_id, (map.get(inv.customer_id) ?? 0) + inv.total);
      });
    return map;
  }, [allInvoices]);

  const lastContactDates = useMemo(() => {
    const map = new Map<string, string>();
    allActivities.forEach((a) => {
      if (a.customer_id) {
        const existing = map.get(a.customer_id);
        if (!existing || new Date(a.created_at) > new Date(existing)) {
          map.set(a.customer_id, a.created_at);
        }
      }
    });
    return map;
  }, [allActivities]);

  function getCustomerLeadCount(customerId: string) {
    return allLeads.filter((l) => l.customer_id === customerId).length;
  }

  function getLatestLeadStatus(customerId: string) {
    const customerLeads = allLeads
      .filter((l) => l.customer_id === customerId)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    return customerLeads[0]?.status ?? null;
  }

  const filtered = useMemo(() => {
    return allCustomers.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.notes?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (serviceFilter && c.service_type !== serviceFilter) return false;
      if (sourceFilter && c.source !== sourceFilter) return false;
      if (tagFilter && !(tags[c.id] ?? []).includes(tagFilter)) return false;
      return true;
    });
  }, [search, serviceFilter, sourceFilter, tagFilter, tags]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "city":
          cmp = (a.city ?? "").localeCompare(b.city ?? "");
          break;
        case "service_type":
          cmp = (a.service_type ?? "").localeCompare(b.service_type ?? "");
          break;
        case "leads":
          cmp = getCustomerLeadCount(a.id) - getCustomerLeadCount(b.id);
          break;
        case "lifetime_value":
          cmp = (lifetimeValues.get(a.id) ?? 0) - (lifetimeValues.get(b.id) ?? 0);
          break;
        case "last_contact": {
          const da = lastContactDates.get(a.id) ?? "1970-01-01";
          const db = lastContactDates.get(b.id) ?? "1970-01-01";
          cmp = new Date(da).getTime() - new Date(db).getTime();
          break;
        }
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir, lifetimeValues, lastContactDates]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortBy !== col) return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-brand" />
    ) : (
      <ArrowDown className="h-3 w-3 text-brand" />
    );
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function startEdit(customerId: string, field: string, value: string) {
    setEditingCell({ customerId, field });
    setEditValue(value);
  }

  function removeTag(customerId: string, tag: string) {
    setTags((prev) => ({
      ...prev,
      [customerId]: (prev[customerId] ?? []).filter((t) => t !== tag),
    }));
  }

  function exportCsv() {
    const rows = [
      ["Name", "Email", "Phone", "City", "State", "ZIP", "Service Type", "Source", "Tags", "Lifetime Value", "Last Contact"],
      ...filtered.map((c) => [
        c.name,
        c.email ?? "",
        c.phone ?? "",
        c.city ?? "",
        c.state ?? "",
        c.zip ?? "",
        c.service_type ?? "",
        c.source ?? "",
        (tags[c.id] ?? []).join("; "),
        String(lifetimeValues.get(c.id) ?? 0),
        lastContactDates.get(c.id) ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tft-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allTags = [...new Set(Object.values(tags).flat())];
  const hasFilters = search || serviceFilter || sourceFilter || tagFilter;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-[var(--muted)]">Loading...</div>
    </div>
  );

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Customers"
        subtitle={`Showing ${filtered.length} of ${allCustomers.length} customers`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <Link
              href="/customers/new"
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone, city, or notes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="">All Services</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
            >
              <option value="">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      {hasFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              &quot;{search}&quot;
              <button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          {serviceFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {serviceFilter}
              <button onClick={() => setServiceFilter("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          {sourceFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {sourceFilter}
              <button onClick={() => setSourceFilter("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          {tagFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Tag: {tagFilter}
              <button onClick={() => setTagFilter("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          <button
            onClick={() => { setSearch(""); setServiceFilter(""); setSourceFilter(""); setTagFilter(""); }}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            {selectedIds.size === 2 && (
              <button
                onClick={() => setMergeModalOpen(true)}
                className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Merge className="h-3.5 w-3.5" />
                Merge
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selectedIds.size === paged.length}
                    onChange={() => {
                      if (selectedIds.size === paged.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(paged.map((c) => c.id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                </th>
                {[
                  { key: "name" as SortKey, label: "Customer" },
                  { key: "contact" as SortKey, label: "Contact" },
                  { key: "city" as SortKey, label: "Location" },
                  { key: "service_type" as SortKey, label: "Service" },
                  { key: "tags" as SortKey, label: "Tags" },
                  { key: "status" as SortKey, label: "Status" },
                  { key: "leads" as SortKey, label: "Leads" },
                  { key: "lifetime_value" as SortKey, label: "LTV" },
                  { key: "last_contact" as SortKey, label: "Last Contact" },
                ].map(({ key, label }) => {
                  const sortable = !["contact", "tags", "status"].includes(key);
                  return (
                    <th
                      key={key}
                      className={clsx(
                        "px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500",
                        sortable && "cursor-pointer select-none hover:text-slate-700"
                      )}
                      onClick={() => sortable && handleSort(key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortable && <SortIcon col={key} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((customer) => {
                const latestStatus = getLatestLeadStatus(customer.id);
                const statusConfig = latestStatus
                  ? LEAD_STATUS_CONFIG[latestStatus]
                  : null;
                const ltv = lifetimeValues.get(customer.id) ?? 0;
                const lastContact = lastContactDates.get(customer.id);
                const lastContactInfo = lastContact ? formatDaysAgo(lastContact) : null;
                const customerTags = tags[customer.id] ?? [];
                const isSelected = selectedIds.has(customer.id);

                return (
                  <tr
                    key={customer.id}
                    className={clsx(
                      "transition-colors hover:bg-slate-50",
                      isSelected && "bg-brand/5"
                    )}
                  >
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(customer.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-sm font-medium text-brand hover:text-brand-hover"
                      >
                        {customer.name}
                      </Link>
                      {customer.source && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          via {customer.source}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${customer.phone}`}
                              className="flex items-center gap-1.5 text-xs text-brand hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </a>
                            <a
                              href={`sms:${customer.phone}`}
                              className="text-slate-400 hover:text-brand"
                              title="Text"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {customer.email && (
                          <a
                            href={`mailto:${customer.email}`}
                            className="flex items-center gap-1.5 text-xs text-brand hover:underline"
                          >
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {customer.city}, {customer.state}
                      </div>
                    </td>
                    <td
                      className="px-4 py-4"
                      onDoubleClick={() =>
                        startEdit(customer.id, "service_type", customer.service_type ?? "")
                      }
                    >
                      {editingCell?.customerId === customer.id &&
                      editingCell?.field === "service_type" ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") setEditingCell(null);
                          }}
                          className="w-full rounded border border-brand px-2 py-1 text-xs text-slate-700 focus:outline-none"
                        />
                      ) : (
                        <span className="text-xs text-slate-600">
                          {customer.service_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {customerTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(customer.id, tag)}
                              className="hover:text-red-500"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {statusConfig && (
                        <Badge
                          label={statusConfig.label}
                          color={statusConfig.color}
                          bgColor={statusConfig.bgColor}
                        />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">
                        {getCustomerLeadCount(customer.id)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={clsx(
                          "text-sm font-medium",
                          ltv > 0 ? "text-emerald-600" : "text-slate-400"
                        )}
                      >
                        {ltv > 0 ? formatCurrency(ltv) : "--"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {lastContactInfo ? (
                        <span className={clsx("text-xs font-medium", lastContactInfo.color)}>
                          {lastContactInfo.text}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paged.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No customers match your search criteria.
            </div>
          )}
          <Pagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paged.map((customer) => {
          const latestStatus = getLatestLeadStatus(customer.id);
          const statusConfig = latestStatus ? LEAD_STATUS_CONFIG[latestStatus] : null;
          const ltv = lifetimeValues.get(customer.id) ?? 0;

          return (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-brand/30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{customer.name}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {customer.city}, {customer.state}
                  </div>
                </div>
                {statusConfig && (
                  <Badge
                    label={statusConfig.label}
                    color={statusConfig.color}
                    bgColor={statusConfig.bgColor}
                  />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                {customer.phone && (
                  <span className="text-xs text-brand">{customer.phone}</span>
                )}
                {ltv > 0 && (
                  <span className="text-xs font-medium text-emerald-600">
                    {formatCurrency(ltv)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        <Pagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </div>

      {/* Merge Modal */}
      <Modal
        open={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        title="Merge Customers"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Select which fields to keep from each customer. All leads, estimates,
            invoices, and activities will be consolidated under the surviving record.
          </p>
          <p className="text-sm font-medium text-amber-600">
            This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <button
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
              onClick={() => setMergeModalOpen(false)}
            >
              Confirm Merge
            </button>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={() => setMergeModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
