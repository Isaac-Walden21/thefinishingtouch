"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Upload,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  Plus,
  X,
  Check,
  Tag,
  FileUp,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { demoMarketingContacts } from "@/lib/demo-data";
import type { MarketingContact } from "@/lib/types";

const ALL_TAGS = [
  "past-customer", "active-lead", "new-lead", "concrete", "stamped-concrete",
  "driveway", "post-frame", "landscaping", "curbing", "firewood",
  "commercial", "premium", "chatbot", "referral",
];

const MARKETING_TABS = [
  { href: "/marketing/contacts", label: "Contacts" },
  { href: "/marketing/templates", label: "Templates" },
  { href: "/marketing/campaigns", label: "Campaigns" },
  { href: "/marketing/automations", label: "Automations" },
  { href: "/marketing/referrals", label: "Referrals" },
];

export default function MarketingContactsPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "subscribed" | "unsubscribed">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const filtered = demoMarketingContacts.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchTags = selectedTags.length === 0 || selectedTags.some((t) => c.tags.includes(t));
    const matchStatus = statusFilter === "all" || (statusFilter === "subscribed" && c.subscribed) || (statusFilter === "unsubscribed" && !c.subscribed);
    return matchSearch && matchTags && matchStatus;
  });

  const subscribedCount = demoMarketingContacts.filter((c) => c.subscribed).length;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setLastSynced(new Date()); }, 1500);
  };

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>Marketing Contacts</h1>
          <p className="mt-1 text-sm text-slate-500">
            {demoMarketingContacts.length} contacts -- {subscribedCount} subscribed
            {lastSynced && <span className="ml-2 text-emerald-600">Last synced: {lastSynced.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSync} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className={clsx("h-4 w-4", syncing && "animate-spin")} />
            Sync Customers
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {MARKETING_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab.href === "/marketing/contacts" ? "bg-[#0085FF]/10 text-[#0085FF]" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "subscribed" | "unsubscribed")} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none">
          <option value="all">All Status</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <button onClick={() => setShowFilter(!showFilter)} className={clsx("flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors", selectedTags.length > 0 ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]" : "border-slate-200 bg-white text-slate-500 hover:text-slate-700")}>
          <Filter className="h-4 w-4" /> Tags
          {selectedTags.length > 0 && <span className="rounded-full bg-[#0085FF] px-1.5 text-xs text-white">{selectedTags.length}</span>}
        </button>
      </div>

      {/* Result count */}
      <p className="mb-4 text-xs text-slate-400">Showing {filtered.length} of {demoMarketingContacts.length} contacts</p>

      {showFilter && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-700">Segment by Tags</p>
            {selectedTags.length > 0 && <button onClick={() => setSelectedTags([])} className="text-xs text-slate-400 hover:text-slate-600">Clear all</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((tag) => (
              <button key={tag} onClick={() => toggleTag(tag)} className={clsx("rounded-full px-3 py-1 text-xs font-medium transition-colors", selectedTags.includes(tag) ? "bg-[#0085FF] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#0085FF]/30 bg-[#0085FF]/5 p-3">
          <span className="text-sm font-medium text-[#0085FF]">{selectedIds.size} selected</span>
          <button className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <Tag className="h-3 w-3" /> Add Tag
          </button>
          <button className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <Tag className="h-3 w-3" /> Remove Tag
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-slate-400">Cancel</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={() => { if (selectedIds.size === filtered.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map((c) => c.id))); }} className="rounded border-slate-300" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.has(contact.id)} onChange={() => toggleSelect(contact.id)} className="rounded border-slate-300" />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-700">{contact.name}</td>
                <td className="px-4 py-3">
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0085FF]">
                    <Mail className="h-3.5 w-3.5" /> {contact.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">--</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {contact.subscribed ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">Subscribed</span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">Unsubscribed</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">CRM Sync</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">No contacts match your search or filter criteria.</div>
        )}
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">Import CSV</h3>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center mb-4 cursor-pointer hover:border-[#0085FF]/30">
              <FileUp className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 mb-1">Drop your CSV file here</p>
              <p className="text-xs text-slate-400">or click to browse</p>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              CSV should contain columns for: Name, Email, Phone, Tags (comma-separated)
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowImport(false)} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button className="flex-1 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">Upload and Map Columns</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
