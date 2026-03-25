"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import EventModal from "./EventModal";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDeleteEvent?: (id: string) => void;
}

export default function CalendarView({ events, onDeleteEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  function prevWeek() {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 7);
      return n;
    });
  }

  function nextWeek() {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 7);
      return n;
    });
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function getEventsForDay(date: Date): CalendarEvent[] {
    const dayStr = date.toISOString().split("T")[0];
    return events.filter((e) => {
      const eventDay = new Date(e.start_time).toISOString().split("T")[0];
      return eventDay === dayStr && e.status !== "cancelled";
    });
  }

  function getEventStyle(event: CalendarEvent): React.CSSProperties {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 7) * 60;
    const height = (endHour - startHour) * 60;
    return { top: `${top}px`, height: `${Math.max(height, 20)}px` };
  }

  function getEventColor(event: CalendarEvent): string {
    if (event.type === "blocked") return "bg-slate-200 border-slate-300 text-slate-600";
    if (event.type === "personal") return "bg-purple-100 border-purple-300 text-purple-800";
    return "bg-[#0085FF]/10 border-[#0085FF]/30 text-[#0085FF]";
  }

  const monthLabel = weekDates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={goToday} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Today
            </button>
            <button onClick={nextWeek} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200">
          <div className="p-2" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-2 text-center border-l border-slate-200 ${isToday ? "bg-[#0085FF]/5" : ""}`}>
                <div className="text-xs text-slate-500">{DAYS[date.getDay()]}</div>
                <div className={`text-lg font-semibold ${isToday ? "text-[#0085FF]" : "text-[#0F172A]"}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: `${HOURS.length * 60}px` }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 w-[60px] text-right pr-2 text-xs text-slate-400"
              style={{ top: `${(hour - 7) * 60 - 8}px` }}
            >
              {formatHour(hour)}
            </div>
          ))}

          {HOURS.map((hour) => (
            <div
              key={`line-${hour}`}
              className="absolute left-[60px] right-0 border-t border-slate-100"
              style={{ top: `${(hour - 7) * 60}px` }}
            />
          ))}

          {weekDates.map((date, dayIdx) => {
            const dayEvents = getEventsForDay(date);
            return (
              <div
                key={dayIdx}
                className="relative border-l border-slate-200"
                style={{ gridColumn: dayIdx + 2, gridRow: 1 }}
              >
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-left text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(event)}`}
                    style={getEventStyle(event)}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={onDeleteEvent}
      />
    </div>
  );
}
