"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  MapPin,
  Navigation,
  Phone,
  Clock,
  User,
  FileText,
  X,
  Trash2,
  Save,
} from "lucide-react";
import clsx from "clsx";
import { demoCalendarEvents, demoCustomers, demoTeam } from "@/lib/demo-data";
import { EVENT_TYPE_CONFIG, PROJECT_TYPES } from "@/lib/types";
import type { CalendarEvent, EventType, EventStatus } from "@/lib/types";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMonthDates(baseDate: Date): Date[][] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = new Date(firstDay);
  startDay.setDate(startDay.getDate() - startDay.getDay());

  const weeks: Date[][] = [];
  const current = new Date(startDay);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current.getMonth() > month && current.getDay() === 0) break;
  }
  return weeks;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function getEventColor(type: EventType): string {
  const map: Record<EventType, string> = {
    quote_visit: "bg-[#0085FF]/10 border-[#0085FF]/30 text-[#0085FF]",
    pour_day: "bg-emerald-100 border-emerald-300 text-emerald-800",
    cleanup: "bg-amber-100 border-amber-300 text-amber-800",
    delivery: "bg-purple-100 border-purple-300 text-purple-800",
    personal: "bg-slate-100 border-slate-300 text-slate-600",
    blocked: "bg-slate-200 border-slate-400 text-slate-500",
  };
  return map[type] || map.personal;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [teamLanes, setTeamLanes] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>(demoCalendarEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [createHour, setCreateHour] = useState(9);
  const [dragEvent, setDragEvent] = useState<string | null>(null);

  // New event form
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<EventType>("quote_visit");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState(demoTeam[0]?.id || "");
  const [newDescription, setNewDescription] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthWeeks = useMemo(() => getMonthDates(currentDate), [currentDate]);

  const navigate = (dir: -1 | 1) => {
    setCurrentDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + (view === "week" ? 7 : 30) * dir);
      return n;
    });
  };

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
    return { top: `${top}px`, height: `${Math.max(height, 24)}px` };
  }

  function handleSlotClick(date: Date, hour: number) {
    setCreateDate(date);
    setCreateHour(hour);
    setNewStartTime(`${String(hour).padStart(2, "0")}:00`);
    setNewEndTime(`${String(hour + 1).padStart(2, "0")}:00`);
    setShowCreateModal(true);
  }

  function handleCreateEvent() {
    if (!createDate) return;
    const dateStr = createDate.toISOString().split("T")[0];
    const customer = newCustomerId ? demoCustomers.find((c) => c.id === newCustomerId) : null;
    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      team_member_id: newAssignedTo,
      type: newType,
      status: "scheduled" as EventStatus,
      title: newTitle || `${EVENT_TYPE_CONFIG[newType].label}${customer ? ` - ${customer.name}` : ""}`,
      description: newDescription || null,
      start_time: `${dateStr}T${newStartTime}:00`,
      end_time: `${dateStr}T${newEndTime}:00`,
      customer_name: customer?.name || null,
      customer_phone: customer?.phone || null,
      customer_address: customer?.address ? `${customer.address}, ${customer.city}, ${customer.state}` : null,
      service_type: customer?.service_type || null,
      project_description: newDescription || null,
      created_by: "manual",
      lead_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    setShowCreateModal(false);
    resetForm();
  }

  function resetForm() {
    setNewTitle("");
    setNewType("quote_visit");
    setNewCustomerId("");
    setNewDescription("");
    setNewAssignedTo(demoTeam[0]?.id || "");
  }

  // Count site visits for route optimization
  const todayEvents = getEventsForDay(new Date());
  const siteVisitsToday = todayEvents.filter((e) => ["quote_visit", "pour_day", "delivery"].includes(e.type));

  const monthLabel = view === "week"
    ? weekDates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>
            Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage quote visits and team schedules.</p>
        </div>
        <button
          onClick={() => {
            setCreateDate(new Date());
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]"
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#0F172A]">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Today
            </button>
            <button onClick={() => navigate(1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setView("week")}
              className={clsx("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "week" ? "bg-[#0085FF] text-white" : "text-slate-500")}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={clsx("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "month" ? "bg-[#0085FF] text-white" : "text-slate-500")}
            >
              Month
            </button>
          </div>

          {/* Lanes toggle */}
          {view === "week" && (
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              <button
                onClick={() => setTeamLanes(false)}
                className={clsx("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", !teamLanes ? "bg-[#0085FF] text-white" : "text-slate-500")}
              >
                By Day
              </button>
              <button
                onClick={() => setTeamLanes(true)}
                className={clsx("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", teamLanes ? "bg-[#0085FF] text-white" : "text-slate-500")}
              >
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> By Team</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Color Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${cfg.bgColor}`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Route optimization banner */}
      {siteVisitsToday.length >= 2 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Navigation className="h-4 w-4" />
            {siteVisitsToday.length} site visits today
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
              Optimize Route
            </button>
            <button className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100">
              Open in Maps
            </button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {view === "week" ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200">
            <div className="p-2" />
            {weekDates.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={clsx("p-2 text-center border-l border-slate-200", isToday && "bg-[#0085FF]/5")}>
                  <div className="text-xs text-slate-500">{DAYS_SHORT[date.getDay()]}</div>
                  <div className={clsx("text-lg font-semibold", isToday ? "text-[#0085FF]" : "text-[#0F172A]")}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: `${HOURS.length * 60}px` }}>
            {HOURS.map((hour) => (
              <div key={hour} className="absolute left-0 w-[60px] text-right pr-2 text-xs text-slate-400" style={{ top: `${(hour - 7) * 60 - 8}px` }}>
                {formatHour(hour)}
              </div>
            ))}
            {HOURS.map((hour) => (
              <div key={`line-${hour}`} className="absolute left-[60px] right-0 border-t border-slate-100" style={{ top: `${(hour - 7) * 60}px` }} />
            ))}

            {weekDates.map((date, dayIdx) => {
              const dayEvents = getEventsForDay(date);
              return (
                <div key={dayIdx} className="relative border-l border-slate-200" style={{ gridColumn: dayIdx + 2, gridRow: 1 }}>
                  {/* Clickable slots */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 cursor-pointer hover:bg-[#0085FF]/5 transition-colors"
                      style={{ top: `${(hour - 7) * 60}px`, height: "60px" }}
                      onClick={() => handleSlotClick(date, hour)}
                    />
                  ))}
                  {/* Events */}
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                      className={clsx(
                        "absolute left-1 right-1 rounded-md border px-2 py-1 text-left text-xs font-medium truncate cursor-pointer hover:opacity-80 transition-opacity z-10",
                        getEventColor(event.type)
                      )}
                      style={getEventStyle(event)}
                    >
                      <span className="block truncate">{event.title}</span>
                      {event.customer_name && (
                        <span className="block truncate text-[10px] opacity-75">{event.customer_name}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Month View */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-slate-500 border-l border-slate-200 first:border-l-0">
                {d}
              </div>
            ))}
          </div>
          {monthWeeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-slate-200 last:border-b-0">
              {week.map((date, di) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const dayEvents = getEventsForDay(date);

                return (
                  <div
                    key={di}
                    className={clsx(
                      "min-h-24 border-l border-slate-200 first:border-l-0 p-1.5 cursor-pointer hover:bg-slate-50 transition-colors",
                      !isCurrentMonth && "bg-slate-50"
                    )}
                    onClick={() => { setCurrentDate(date); setView("week"); }}
                  >
                    <div className={clsx(
                      "mb-1 text-xs font-medium",
                      isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-[#0085FF] text-white" :
                      isCurrentMonth ? "text-slate-700" : "text-slate-400"
                    )}>
                      {date.getDate()}
                    </div>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div key={ev.id} className={clsx("mb-0.5 truncate rounded px-1 py-0.5 text-[10px] font-medium", getEventColor(ev.type))}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0F172A]">{selectedEvent.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", EVENT_TYPE_CONFIG[selectedEvent.type].bgColor, EVENT_TYPE_CONFIG[selectedEvent.type].color)}>
                    {EVENT_TYPE_CONFIG[selectedEvent.type].label}
                  </span>
                  {selectedEvent.created_by === "agent" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Booked by AI</span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">
                  {new Date(selectedEvent.start_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                  {new Date(selectedEvent.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} --{" "}
                  {new Date(selectedEvent.end_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              {selectedEvent.customer_name && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{selectedEvent.customer_name}</span>
                </div>
              )}
              {selectedEvent.customer_phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${selectedEvent.customer_phone}`} className="text-[#0085FF] hover:underline">{selectedEvent.customer_phone}</a>
                </div>
              )}
              {selectedEvent.customer_address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedEvent.customer_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0085FF] hover:underline"
                  >
                    {selectedEvent.customer_address}
                  </a>
                </div>
              )}
              {selectedEvent.project_description && (
                <div className="flex items-start gap-3 text-sm">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-700">{selectedEvent.project_description}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Edit
              </button>
              <button
                onClick={() => {
                  setEvents((prev) => prev.map((e) => e.id === selectedEvent.id ? { ...e, status: "cancelled" as EventStatus } : e));
                  setSelectedEvent(null);
                }}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Cancel Event
              </button>
              <button onClick={() => setSelectedEvent(null)} className="rounded-lg bg-[#0085FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0177E3]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#0F172A]">New Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Event Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as EventType)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                >
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Auto-generated from type + customer"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none"
                />
              </div>

              {!["personal", "blocked"].includes(newType) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer</label>
                  <select
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                  >
                    <option value="">Select customer...</option>
                    {demoCustomers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assigned To</label>
                <select
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                >
                  {demoTeam.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-[#0085FF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Internal notes..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:border-[#0085FF] focus:outline-none"
                />
              </div>

              {newType === "quote_visit" && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#0085FF]" />
                  Send SMS confirmation to customer
                </label>
              )}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleCreateEvent} className="rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
