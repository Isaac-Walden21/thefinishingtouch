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
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> =
    {
      blue: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        iconBg: "bg-blue-500/20",
      },
      emerald: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        iconBg: "bg-emerald-500/20",
      },
      orange: {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        iconBg: "bg-orange-500/20",
      },
      purple: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        iconBg: "bg-purple-500/20",
      },
    };

  const colors = colorMap[color] ?? colorMap.blue;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`mt-1 text-sm font-medium ${
                trend.positive ? "text-emerald-400" : "text-red-400"
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
