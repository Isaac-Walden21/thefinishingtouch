"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import type { TeamMember } from "@/lib/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface AvailabilityEditorProps {
  teamMembers: TeamMember[];
}

export default function AvailabilityEditor({ teamMembers }: AvailabilityEditorProps) {
  const [selectedMember, setSelectedMember] = useState(teamMembers[0]?.id || "");

  const defaultSchedule: DaySchedule[] = DAYS.map((_, i) => ({
    enabled: i >= 1 && i <= 5,
    start: "07:00",
    end: "17:00",
  }));

  const [schedules, setSchedules] = useState<Record<string, DaySchedule[]>>(() => {
    const init: Record<string, DaySchedule[]> = {};
    for (const m of teamMembers) {
      init[m.id] = [...defaultSchedule.map((d) => ({ ...d }))];
    }
    return init;
  });

  const currentSchedule = schedules[selectedMember] || defaultSchedule;

  const updateDay = (dayIndex: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedules((prev) => {
      const updated = { ...prev };
      const memberSchedule = [...(updated[selectedMember] || defaultSchedule)];
      memberSchedule[dayIndex] = { ...memberSchedule[dayIndex], [field]: value };
      updated[selectedMember] = memberSchedule;
      return updated;
    });
  };

  const copyToWeekdays = () => {
    const mondaySchedule = currentSchedule[1];
    setSchedules((prev) => {
      const updated = { ...prev };
      const memberSchedule = [...(updated[selectedMember] || defaultSchedule)];
      for (let i = 1; i <= 5; i++) {
        memberSchedule[i] = { ...mondaySchedule };
      }
      updated[selectedMember] = memberSchedule;
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Member selector */}
      <div className="flex items-center justify-between">
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
        >
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          onClick={copyToWeekdays}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Monday to All Weekdays
        </button>
      </div>

      {/* Schedule grid */}
      <div className="space-y-2">
        {currentSchedule.map((day, i) => (
          <div
            key={DAYS[i]}
            className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-3"
          >
            <div className="w-12">
              <span className="text-sm font-medium text-slate-700">{SHORT_DAYS[i]}</span>
            </div>

            {/* Toggle */}
            <button
              onClick={() => updateDay(i, "enabled", !day.enabled)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                day.enabled ? "bg-[#0085FF]" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  day.enabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>

            {day.enabled ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={day.start}
                  onChange={(e) => updateDay(i, "start", e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="time"
                  value={day.end}
                  onChange={(e) => updateDay(i, "end", e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                />
              </div>
            ) : (
              <span className="text-sm text-slate-400">OFF</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
