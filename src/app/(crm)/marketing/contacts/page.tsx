"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Upload,
  Filter,
  Mail,
} from "lucide-react";
import { demoMarketingContacts } from "@/lib/demo-data";

const ALL_TAGS = [
  "past-customer",
  "active-lead",
  "new-lead",
  "concrete",
  "stamped-concrete",
  "driveway",
  "post-frame",
  "landscaping",
  "curbing",
  "firewood",
  "commercial",
  "premium",
  "chatbot",
];

export default function MarketingContactsPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  const filtered = demoMarketingContacts.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchTags =
      selectedTags.length === 0 ||
      selectedTags.some((t) => c.tags.includes(t));
    return matchSearch && matchTags;
  });

  const subscribedCount = demoMarketingContacts.filter((c) => c.subscribed).length;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Marketing Contacts</h1>
          <p className="mt-1 text-sm text-slate-500">
            {demoMarketingContacts.length} contacts · {subscribedCount} subscribed
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200">
          <Upload className="h-4 w-4" />
          Import CSV
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <Link href="/marketing/contacts" className="rounded-md bg-[#0085FF]/10 px-4 py-2 text-sm font-medium text-[#0085FF]">
          Contacts
        </Link>
        <Link href="/marketing/templates" className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
          Templates
        </Link>
        <Link href="/marketing/campaigns" className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
          Campaigns
        </Link>
        <Link href="/marketing/automations" className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
          Automations
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            selectedTags.length > 0
              ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
              : "border-slate-200 bg-white text-slate-500 hover:text-slate-700"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter by tag
          {selectedTags.length > 0 && (
            <span className="rounded-full bg-[#0085FF] px-1.5 text-xs text-white">
              {selectedTags.length}
            </span>
          )}
        </button>
      </div>

      {/* Tag filter panel */}
      {showFilter && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-700">Segment by Tags</p>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-[#0085FF] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contacts table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-700">{contact.name}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {contact.subscribed ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                      Subscribed
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400">
                      Unsubscribed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            No contacts match your search or filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
