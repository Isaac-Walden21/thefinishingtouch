"use client";

import { useState } from "react";
import { Search, Filter, ArrowRight } from "lucide-react";
import type { AuditLogEntry } from "@/lib/types";

interface AuditLogProps {
  entries: AuditLogEntry[];
}

export default function AuditLog({ entries }: AuditLogProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = [...new Set(entries.map((e) => e.category))];

  const filtered = entries
    .filter((e) => {
      const matchSearch =
        !search ||
        e.action.toLowerCase().includes(search.toLowerCase()) ||
        e.user_name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || e.category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No audit entries found.</p>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                {entry.user_name.split(" ").map((w) => w[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{entry.action}</p>
                {(entry.old_value || entry.new_value) && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    {entry.old_value && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-500 line-through">
                        {entry.old_value}
                      </span>
                    )}
                    {entry.old_value && entry.new_value && (
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    )}
                    {entry.new_value && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
                        {entry.new_value}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{entry.user_name}</span>
                  <span>--</span>
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">{entry.category}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
