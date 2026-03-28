"use client";

import { useState } from "react";
import { Settings, Users, Bell, Shield } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { demoTeam } from "@/lib/demo-data";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    newLead: true,
    quoteFollowUp: true,
    paymentReceived: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationItems = [
    { key: "newLead" as const, label: "New lead notifications", description: "Get notified when a new lead comes in" },
    { key: "quoteFollowUp" as const, label: "Quote follow-ups", description: "Remind when a quoted lead hasn't responded in 3 days" },
    { key: "paymentReceived" as const, label: "Payment received", description: "Notify when a payment is received" },
  ];

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader title="Settings" subtitle="Manage your team and CRM configuration." />

      <div className="max-w-3xl space-y-8">
        {/* Team Members */}
        <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
          </div>
          <div className="space-y-3">
            {demoTeam.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {member.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="space-y-4">
            {notificationItems.map((item) => {
              const isOn = notifications[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(item.key)}
                    role="switch"
                    aria-checked={isOn}
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${isOn ? "bg-brand" : "bg-slate-300"}`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white transition-transform ${isOn ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* CRM Settings */}
        <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-foreground">CRM Settings</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-500">
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span>Company Name</span>
              <span className="text-slate-700">The Finishing Touch LLC</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span>Default State</span>
              <span className="text-slate-700">Indiana (IN)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span>Time Zone</span>
              <span className="text-slate-700">Eastern (ET)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Data Mode</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                Demo Data
              </span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
          </div>
          <p className="text-sm text-slate-500">
            Authentication is powered by Supabase. Configure auth settings in your Supabase dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
