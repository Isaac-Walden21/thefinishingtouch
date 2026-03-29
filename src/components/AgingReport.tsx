"use client";

import type { Invoice } from "@/lib/types";

interface AgingBucket {
  label: string;
  color: string;
  bgColor: string;
  amount: number;
  count: number;
  key: string;
}

interface AgingReportProps {
  invoices: Invoice[];
  onBucketClick?: (bucket: string) => void;
  activeBucket?: string | null;
}

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

export default function AgingReport({ invoices, onBucketClick, activeBucket }: AgingReportProps) {
  const now = new Date();
  const outstanding = invoices.filter((i) =>
    ["sent", "viewed", "partial", "overdue"].includes(i.status)
  );

  const buckets: AgingBucket[] = [
    { label: "Current (0-30)", color: "bg-emerald-500", bgColor: "bg-emerald-50", amount: 0, count: 0, key: "current" },
    { label: "31-60 days", color: "bg-amber-500", bgColor: "bg-amber-50", amount: 0, count: 0, key: "31-60" },
    { label: "61-90 days", color: "bg-orange-500", bgColor: "bg-orange-50", amount: 0, count: 0, key: "61-90" },
    { label: "90+ days", color: "bg-red-500", bgColor: "bg-red-50", amount: 0, count: 0, key: "90+" },
  ];

  for (const inv of outstanding) {
    const sentDate = inv.sent_at ? new Date(inv.sent_at) : new Date(inv.created_at);
    const daysSince = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince <= 30) {
      buckets[0].amount += inv.total;
      buckets[0].count++;
    } else if (daysSince <= 60) {
      buckets[1].amount += inv.total;
      buckets[1].count++;
    } else if (daysSince <= 90) {
      buckets[2].amount += inv.total;
      buckets[2].count++;
    } else {
      buckets[3].amount += inv.total;
      buckets[3].count++;
    }
  }

  const totalAmount = buckets.reduce((sum, b) => sum + b.amount, 0);

  if (totalAmount === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Aging Report</h3>
        <p className="text-sm text-slate-400">No outstanding invoices.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Aging Report</h3>

      {/* Stacked bar */}
      <div className="mb-3 flex h-6 overflow-hidden rounded-full">
        {buckets.map((bucket) => {
          const percent = (bucket.amount / totalAmount) * 100;
          if (percent === 0) return null;
          return (
            <button
              key={bucket.key}
              onClick={() => onBucketClick?.(bucket.key)}
              className={`${bucket.color} transition-opacity hover:opacity-80 ${
                activeBucket && activeBucket !== bucket.key ? "opacity-40" : ""
              }`}
              style={{ width: `${percent}%` }}
              title={`${bucket.label}: ${fmt.format(bucket.amount)} (${bucket.count})`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {buckets.map((bucket) => (
          <button
            key={bucket.key}
            onClick={() => onBucketClick?.(bucket.key)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
              activeBucket === bucket.key
                ? "border border-slate-300 bg-slate-50"
                : "hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`h-2.5 w-2.5 rounded-sm ${bucket.color}`} />
              {bucket.label}
            </span>
            <span className="text-xs font-medium text-slate-700">
              {fmt.format(bucket.amount)} ({bucket.count})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
