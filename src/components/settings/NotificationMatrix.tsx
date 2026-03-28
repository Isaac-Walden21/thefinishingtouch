"use client";

import { useState } from "react";

interface NotificationEvent {
  key: string;
  label: string;
  defaults: { inApp: boolean; email: boolean; sms: boolean };
}

const EVENTS: NotificationEvent[] = [
  { key: "new_lead", label: "New lead created", defaults: { inApp: true, email: true, sms: false } },
  { key: "lead_assigned", label: "Lead assigned to me", defaults: { inApp: true, email: true, sms: true } },
  { key: "quote_followup", label: "Quote follow-up due", defaults: { inApp: true, email: false, sms: false } },
  { key: "payment_received", label: "Payment received", defaults: { inApp: true, email: true, sms: false } },
  { key: "invoice_overdue", label: "Invoice overdue", defaults: { inApp: true, email: true, sms: false } },
  { key: "agent_pending", label: "Agent action pending", defaults: { inApp: true, email: true, sms: false } },
  { key: "estimate_accepted", label: "Estimate accepted", defaults: { inApp: true, email: true, sms: true } },
  { key: "calendar_tomorrow", label: "Calendar event tomorrow", defaults: { inApp: true, email: false, sms: true } },
  { key: "customer_unsub", label: "Customer unsubscribed", defaults: { inApp: true, email: false, sms: false } },
];

const CHANNELS = ["inApp", "email", "sms"] as const;
const CHANNEL_LABELS = { inApp: "In-App", email: "Email", sms: "SMS" };

type Preferences = Record<string, Record<string, boolean>>;

interface NotificationMatrixProps {
  onSave?: (prefs: Preferences) => void;
}

export default function NotificationMatrix({ onSave }: NotificationMatrixProps) {
  const [muteAll, setMuteAll] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(() => {
    const initial: Preferences = {};
    for (const event of EVENTS) {
      initial[event.key] = { ...event.defaults };
    }
    return initial;
  });

  const toggle = (eventKey: string, channel: string) => {
    const updated = {
      ...prefs,
      [eventKey]: { ...prefs[eventKey], [channel]: !prefs[eventKey][channel] },
    };
    setPrefs(updated);
    onSave?.(updated);
  };

  return (
    <div className="space-y-4">
      {/* Mute all */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-medium text-slate-700">Mute All Notifications</p>
          <p className="text-xs text-slate-500">Vacation mode -- pause everything</p>
        </div>
        <button
          onClick={() => setMuteAll(!muteAll)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            muteAll ? "bg-red-500" : "bg-slate-200"
          }`}
        >
          <div
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              muteAll ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Matrix */}
      <div className={muteAll ? "pointer-events-none opacity-40" : ""}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-medium uppercase text-slate-500">
              <th className="py-3 text-left">Event</th>
              {CHANNELS.map((ch) => (
                <th key={ch} className="py-3 text-center w-20">
                  {CHANNEL_LABELS[ch]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {EVENTS.map((event) => (
              <tr key={event.key}>
                <td className="py-3 text-sm text-slate-600">{event.label}</td>
                {CHANNELS.map((ch) => (
                  <td key={ch} className="py-3 text-center">
                    <button
                      onClick={() => toggle(event.key, ch)}
                      className={`h-5 w-5 rounded border-2 transition-colors ${
                        prefs[event.key]?.[ch]
                          ? "border-[#0085FF] bg-[#0085FF]"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {prefs[event.key]?.[ch] && (
                        <svg className="h-full w-full text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
