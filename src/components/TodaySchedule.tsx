"use client";

import Link from "next/link";
import { Clock, Phone, MapPin, ArrowRight } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { formatTime } from "@/lib/format";

interface TodayScheduleProps {
  events: CalendarEvent[];
}

export function TodaySchedule({ events }: TodayScheduleProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-semibold text-foreground">Today&apos;s Schedule</h2>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
        >
          Full calendar
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No events scheduled for today.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand">
                      {formatTime(event.start_time)}
                    </span>
                    <span className="text-xs text-slate-400">-</span>
                    <span className="text-sm text-slate-500">
                      {formatTime(event.end_time)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  {event.customer_name && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {event.customer_name}
                    </p>
                  )}
                  {event.customer_address && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {event.customer_address}
                    </div>
                  )}
                  {event.service_type && (
                    <span className="mt-1 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                      {event.service_type}
                    </span>
                  )}
                </div>
                {event.customer_phone && (
                  <a
                    href={`tel:${event.customer_phone}`}
                    className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-brand/30 hover:text-brand"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
