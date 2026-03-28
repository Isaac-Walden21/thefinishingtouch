import {
  Phone,
  Mail,
  FileText,
  CreditCard,
  StickyNote,
  Bot,
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";

const activityConfig: Record<
  ActivityType,
  { icon: typeof Phone; color: string; bgColor: string }
> = {
  call: { icon: Phone, color: "text-brand", bgColor: "bg-brand/10" },
  email: { icon: Mail, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  quote: { icon: FileText, color: "text-orange-600", bgColor: "bg-orange-50" },
  payment: { icon: CreditCard, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  note: { icon: StickyNote, color: "text-slate-500", bgColor: "bg-slate-100" },
  ai_action: { icon: Bot, color: "text-purple-600", bgColor: "bg-purple-50" },
};

export default function ActivityTimeline({
  activities,
}: {
  activities: Activity[];
}) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">No activity recorded yet.</p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, i) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;
        const isLast = i === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-2 ${config.bgColor}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-slate-200" />}
            </div>
            <div className="pb-6">
              <p className="text-sm text-slate-700">{activity.description}</p>
              <p className="mt-1 text-xs text-slate-400">
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
