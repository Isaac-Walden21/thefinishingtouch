import { Settings, Users, Bell, Shield } from "lucide-react";
import { demoTeam } from "@/lib/demo-data";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your team and CRM configuration.
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Team Members */}
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Team Members</h2>
          </div>
          <div className="space-y-3">
            {demoTeam.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-[#0d1526] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {member.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {member.name}
                    </p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium capitalize text-slate-300">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "New lead notifications", description: "Get notified when a new lead comes in" },
              { label: "Quote follow-ups", description: "Remind when a quoted lead hasn't responded in 3 days" },
              { label: "Payment received", description: "Notify when a payment is received" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-blue-600 p-0.5 cursor-pointer">
                  <div className="h-5 w-5 rounded-full bg-white translate-x-5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CRM Settings */}
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">CRM Settings</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-400">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span>Company Name</span>
              <span className="text-slate-200">The Finishing Touch LLC</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span>Default State</span>
              <span className="text-slate-200">Indiana (IN)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span>Time Zone</span>
              <span className="text-slate-200">Eastern (ET)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Data Mode</span>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400">
                Demo Data
              </span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>
          <p className="text-sm text-slate-400">
            Authentication is powered by Supabase. Configure auth settings in
            your Supabase dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
