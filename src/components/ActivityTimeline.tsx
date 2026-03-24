import {
  Phone,
  Mail,
  FileText,
  CreditCard,
  StickyNote,
  Bot,
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";

const activityConfig: Record<
  ActivityType,
  { icon: typeof Phone; color: string; bgColor: string }
> = {
  call: { icon: Phone, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  email: { icon: Mail, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  quote: {
    icon: FileText,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  payment: {
    icon: CreditCard,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  note: {
    icon: StickyNote,
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
  },
  ai_action: {
    icon: Bot,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ActivityTimeline({
  activities,
}: {
  activities: Activity[];
}) {
  const sorted = [...activities].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">No activity recorded yet.</p>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((activity, i) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;
        const isLast = i === sorted.length - 1;

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-2 ${config.bgColor}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-slate-700/50" />}
            </div>
            <div className={`pb-6 ${isLast ? "" : ""}`}>
              <p className="text-sm text-slate-200">{activity.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(activity.created_at)} at{" "}
                {formatTime(activity.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
