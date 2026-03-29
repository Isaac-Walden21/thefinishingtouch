"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Filter,
  Camera,
  MapPin,
  Flame,
  Sun,
  Snowflake,
  Ruler,
  FileText,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import { demoJobWalks, demoJobWalkPhotos, demoCustomers } from "@/lib/demo-data";
import { JOB_WALK_STATUS_CONFIG, type JobWalkStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const PRIORITY_ICONS = {
  hot: { icon: Flame, label: "Hot", className: "text-red-500" },
  warm: { icon: Sun, label: "Warm", className: "text-amber-500" },
  cool: { icon: Snowflake, label: "Cool", className: "text-blue-400" },
} as const;

function getTotalSqft(areas: { length: number; width: number }[]): number {
  return areas.reduce((sum, a) => sum + a.length * a.width, 0);
}

export default function JobWalkListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobWalkStatus | "">("");

  const jobWalks = useMemo(() => {
    return demoJobWalks
      .map((jw) => ({
        ...jw,
        customer: demoCustomers.find((c) => c.id === jw.customer_id),
        photos: demoJobWalkPhotos.filter((p) => p.job_walk_id === jw.id),
      }))
      .filter((jw) => {
        const matchesSearch =
          !search ||
          (jw.customer?.name ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || jw.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [search, statusFilter]);

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Job Walks"
        subtitle="On-site capture for accurate estimates"
        actions={
          <Link
            href="/job-walk/new"
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" />
            New Job Walk
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => setSearch(v)}
          placeholder="Search by customer name..."
          className="flex-1 max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobWalkStatus | "")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
            <option value="estimated">Estimated</option>
          </select>
        </div>
      </div>

      {/* Job Walk Cards */}
      <div className="space-y-4">
        {jobWalks.map((jw) => {
          const statusCfg = JOB_WALK_STATUS_CONFIG[jw.status];
          const totalSqft = getTotalSqft(jw.measurements.areas);
          const priority = jw.customer_preferences.priority;
          const PriorityIcon = priority ? PRIORITY_ICONS[priority] : null;

          return (
            <Link
              key={jw.id}
              href={`/job-walk/${jw.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {jw.customer?.name ?? "Unknown Customer"}
                    </h3>
                    {PriorityIcon && (
                      <PriorityIcon.icon
                        className={clsx("h-4 w-4 shrink-0", PriorityIcon.className)}
                      />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatDate(jw.created_at)}
                    {jw.customer?.address && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {jw.customer.address}, {jw.customer.city}
                      </span>
                    )}
                  </p>
                </div>
                <Badge
                  label={statusCfg.label}
                  color={statusCfg.color}
                  bgColor={statusCfg.bgColor}
                />
              </div>

              {/* Summary row */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5" />
                  {jw.photos.length} photo{jw.photos.length !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5" />
                  {totalSqft.toLocaleString()} sqft
                </span>
                {jw.measurements.areas.length > 1 && (
                  <span className="text-xs text-slate-400">
                    ({jw.measurements.areas.length} areas)
                  </span>
                )}
                {jw.estimate_id && (
                  <span className="inline-flex items-center gap-1 text-brand">
                    <FileText className="h-3.5 w-3.5" />
                    Estimate #{jw.estimate_id}
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {jobWalks.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-sm text-slate-500">No job walks found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
