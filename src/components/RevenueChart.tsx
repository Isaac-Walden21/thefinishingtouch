"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Payment } from "@/lib/types";

interface RevenueChartProps {
  payments: Payment[];
}

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

function getWeekLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface WeekBucket {
  label: string;
  stripe: number;
  cash: number;
  check: number;
  other: number;
  total: number;
}

export default function RevenueChart({ payments }: RevenueChartProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const weeks = useMemo(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const buckets: WeekBucket[] = [];
    const weekStart = new Date(ninetyDaysAgo);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    while (weekStart < now) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const bucket: WeekBucket = {
        label: getWeekLabel(weekStart),
        stripe: 0,
        cash: 0,
        check: 0,
        other: 0,
        total: 0,
      };

      for (const p of payments) {
        const d = new Date(p.created_at);
        if (d >= weekStart && d < weekEnd) {
          const method = p.method || "other";
          if (method === "stripe") bucket.stripe += p.amount;
          else if (method === "cash") bucket.cash += p.amount;
          else if (method === "check") bucket.check += p.amount;
          else bucket.other += p.amount;
          bucket.total += p.amount;
        }
      }

      buckets.push(bucket);
      weekStart.setDate(weekStart.getDate() + 7);
    }

    return buckets;
  }, [payments]);

  const maxTotal = Math.max(...weeks.map((w) => w.total), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <h3 className="text-sm font-semibold text-slate-700">
          Revenue (Last 90 Days)
        </h3>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          {/* Legend */}
          <div className="mb-3 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#0085FF]" />
              Stripe
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Cash
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              Check
            </span>
          </div>

          {/* Chart */}
          <div className="flex items-end gap-1" style={{ height: 120 }}>
            {weeks.map((week, i) => {
              const heightPercent = (week.total / maxTotal) * 100;
              const stripeH = week.total > 0 ? (week.stripe / week.total) * heightPercent : 0;
              const cashH = week.total > 0 ? (week.cash / week.total) * heightPercent : 0;
              const checkH = week.total > 0 ? (week.check / week.total) * heightPercent : 0;

              return (
                <div
                  key={i}
                  className="relative flex flex-1 flex-col justify-end"
                  style={{ height: "100%" }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {hoveredIndex === i && week.total > 0 && (
                    <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] text-white shadow-lg">
                      {fmt.format(week.total)}
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden rounded-t-sm">
                    {stripeH > 0 && (
                      <div
                        className="bg-[#0085FF] transition-all duration-300"
                        style={{ height: `${stripeH}%` }}
                      />
                    )}
                    {cashH > 0 && (
                      <div
                        className="bg-emerald-500 transition-all duration-300"
                        style={{ height: `${cashH}%` }}
                      />
                    )}
                    {checkH > 0 && (
                      <div
                        className="bg-amber-500 transition-all duration-300"
                        style={{ height: `${checkH}%` }}
                      />
                    )}
                    {week.total === 0 && (
                      <div className="h-0.5 rounded bg-slate-200" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels -- show every 4th */}
          <div className="mt-1 flex gap-1">
            {weeks.map((week, i) => (
              <div key={i} className="flex-1 text-center">
                {i % 4 === 0 && (
                  <span className="text-[9px] text-slate-400">{week.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
