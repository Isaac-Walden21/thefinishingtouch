"use client";

import { X, Clock, User, MapPin, Phone, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import type { CalendarEvent } from "@/lib/types";

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onSave?: (event: Partial<CalendarEvent>) => void;
  onDelete?: (id: string) => void;
}

export default function EventModal({ event, onClose, onDelete }: EventModalProps) {
  if (!event) return null;

  const isQuote = event.type === "quote_visit";
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                event.type === "quote_visit" ? "bg-brand/10 text-brand" :
                event.type === "blocked" ? "bg-slate-100 text-slate-600" :
                "bg-purple-50 text-purple-600"
              }`}>
                {event.type === "quote_visit" ? "Quote Visit" : event.type === "blocked" ? "Blocked" : "Personal"}
              </span>
              {event.created_by === "agent" && (
                <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Booked by AI</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700">
              {startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
              {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} &mdash;{" "}
              {endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          {isQuote && event.customer_name && (
            <>
              <div className="flex items-center gap-3 text-sm"><User className="h-4 w-4 text-slate-400" /><span className="text-slate-700">{event.customer_name}</span></div>
              {event.customer_phone && (
                <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-slate-400" /><a href={`tel:${event.customer_phone}`} className="text-brand hover:underline">{event.customer_phone}</a></div>
              )}
              {event.customer_address && (
                <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-slate-400" /><span className="text-slate-700">{event.customer_address}</span></div>
              )}
              {event.project_description && (
                <div className="flex items-start gap-3 text-sm"><FileText className="h-4 w-4 text-slate-400 mt-0.5" /><span className="text-slate-700">{event.project_description}</span></div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          {onDelete && (
            <Button variant="danger" onClick={() => onDelete(event.id)}>Cancel Event</Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
