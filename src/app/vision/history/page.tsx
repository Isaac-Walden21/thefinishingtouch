"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Image as ImageIcon,
  Sparkles,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { demoVisionProjects, demoCustomers } from "@/lib/demo-data";

export default function VisionHistoryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const serviceTypes = [
    ...new Set(demoVisionProjects.map((p) => p.service_type)),
  ];

  const projects = demoVisionProjects
    .filter((p) => {
      const matchesSearch =
        !search ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        (p.customer_name || "").toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || p.service_type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <div className="p-8">
      <Link
        href="/vision"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vision Studio
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Vision History</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse all past AI visualizations
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700/50 bg-[#0d1526] pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-700/50 bg-[#0d1526] px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Project Types</option>
            {serviceTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500">No visualizations found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((proj) => {
            const customer = demoCustomers.find(
              (c) => c.id === proj.customer_id
            );
            const isExpanded = expandedId === proj.id;

            return (
              <div
                key={proj.id}
                className="rounded-xl border border-slate-700/50 bg-[#111a2e] overflow-hidden"
              >
                {/* Project Header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : proj.id)
                  }
                  className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-slate-800/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {proj.service_type}
                      </h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {proj.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                        {proj.customer_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {proj.customer_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(proj.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {proj.iterations.length} iteration
                          {proj.iterations.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </button>

                {/* Expanded: Iterations */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                          Original Photo
                        </p>
                        <div className="w-full rounded-lg bg-[#0d1526] aspect-[4/3] flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-slate-700" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                          Latest Visualization
                        </p>
                        <div className="w-full rounded-lg bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-slate-700/50 aspect-[4/3] flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-blue-400/50" />
                        </div>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      All Iterations
                    </h4>
                    <div className="space-y-3">
                      {proj.iterations.map((iter, idx) => (
                        <div
                          key={iter.id}
                          className="flex items-start gap-3 rounded-lg border border-slate-700/30 bg-[#0d1526] p-3"
                        >
                          <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-slate-500">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            {iter.add_on && (
                              <span className="inline-flex rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400 mb-1">
                                + {iter.add_on}
                              </span>
                            )}
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {iter.prompt_used}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-1">
                              {new Date(iter.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    {customer && (
                      <div className="mt-4 flex gap-3">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="flex items-center gap-2 rounded-lg border border-slate-700/50 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800"
                        >
                          <User className="h-3 w-3" />
                          View Customer
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
