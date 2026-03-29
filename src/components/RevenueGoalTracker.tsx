"use client";

import { Target } from "lucide-react";
import clsx from "clsx";
import { formatCurrency } from "@/lib/format";

interface RevenueGoalTrackerProps {
  actual: number;
  target: number;
  projected?: number;
}

export function RevenueGoalTracker({
  actual,
  target,
  projected,
}: RevenueGoalTrackerProps) {
  const pct = Math.min((actual / target) * 100, 100);
  const projPct = projected ? Math.min((projected / target) * 100, 100) : null;

  let status: "green" | "amber" | "red";
  if (pct >= 80) status = "green";
  else if (pct >= 50) status = "amber";
  else status = "red";

  const barColor = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  }[status];

  const statusLabel = {
    green: "On Track",
    amber: "Behind",
    red: "Critical",
  }[status];

  const statusColor = {
    green: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50",
  }[status];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Revenue Goal</h2>
        </div>
        <span
          className={clsx(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            statusColor
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mb-2 flex items-end justify-between">
        <span className="text-2xl font-bold text-foreground">
          {formatCurrency(actual)}
        </span>
        <span className="text-sm text-slate-500">
          of {formatCurrency(target)} target
        </span>
      </div>

      <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
        {projPct && (
          <div
            className="absolute top-0 h-full border-r-2 border-dashed border-slate-400"
            style={{ left: `${projPct}%` }}
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>{Math.round(pct)}% achieved</span>
        {projected && (
          <span>Projected: {formatCurrency(projected)}</span>
        )}
      </div>
    </div>
  );
}
