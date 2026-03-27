import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: StatsCardProps) {
  const colorMap: Record<string, { text: string; iconBg: string }> = {
    blue: {
      text: "text-[#0085FF]",
      iconBg: "bg-[#0085FF]/10",
    },
    emerald: {
      text: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    orange: {
      text: "text-orange-600",
      iconBg: "bg-orange-50",
    },
    purple: {
      text: "text-purple-600",
      iconBg: "bg-purple-50",
    },
  };

  const colors = colorMap[color] ?? colorMap.blue;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans), sans-serif" }}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`mt-1 text-sm font-medium ${
                trend.positive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${colors.iconBg}`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}
