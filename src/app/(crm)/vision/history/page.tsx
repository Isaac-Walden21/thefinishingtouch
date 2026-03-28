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
  Star,
  Grid,
} from "lucide-react";
import clsx from "clsx";
import { demoVisionProjects, demoCustomers } from "@/lib/demo-data";

export default function VisionHistoryPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [portfolioMode, setPortfolioMode] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const serviceTypes = [...new Set(demoVisionProjects.map((p) => p.service_type))];

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const projects = demoVisionProjects
    .filter((p) => {
      const matchesSearch =
        !search ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        (p.customer_name || "").toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || p.service_type === typeFilter;
      const matchesPortfolio = !portfolioMode || starred.has(p.id);
      return matchesSearch && matchesType && matchesPortfolio;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <Link href="/vision" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Vision Studio
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>
            {portfolioMode ? "Portfolio" : "Vision History"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {portfolioMode ? "Your best before/after projects" : "Browse all past AI visualizations"}
          </p>
        </div>
        <button
          onClick={() => setPortfolioMode(!portfolioMode)}
          className={clsx(
            "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
            portfolioMode
              ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Star className={clsx("h-4 w-4", portfolioMode && "fill-current")} />
          {portfolioMode ? "Show All" : "Portfolio Mode"}
        </button>
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
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
        >
          <option value="">All Project Types</option>
          {serviceTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
      </div>

      {/* Gallery Grid */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">
            {portfolioMode ? "No starred projects yet. Star your best work to build your portfolio." : "No visualizations found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => {
            const customer = demoCustomers.find((c) => c.id === proj.customer_id);
            const isStarred = starred.has(proj.id);

            return (
              <div key={proj.id} className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-colors hover:border-[#0085FF]/30">
                {/* Thumbnail area */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-[#0085FF]/10 to-purple-100 flex items-center justify-center">
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    </div>
                    <div className="w-px bg-white/50" />
                    <div className="flex-1 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-[#0085FF]/30" />
                    </div>
                  </div>
                  {/* Star button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(proj.id); }}
                    className={clsx(
                      "absolute top-2 right-2 rounded-full p-1.5 transition-colors",
                      isStarred
                        ? "bg-amber-400 text-white"
                        : "bg-black/30 text-white/70 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Star className={clsx("h-4 w-4", isStarred && "fill-current")} />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-1">{proj.service_type}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{proj.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      {proj.customer_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {proj.customer_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> {proj.iterations.length}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(proj.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
