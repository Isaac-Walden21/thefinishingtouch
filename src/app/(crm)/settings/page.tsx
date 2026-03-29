"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Bell,
  FileText,
  Bot,
  Plug,
  Calendar,
  CreditCard,
  History,
  Database,
  AlertTriangle,
  Download,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";
import type {
  CompanySettings,
  IntegrationConfig,
  AuditLogEntry,
  TeamMember,
} from "@/lib/types";
import CompanyProfile from "@/components/settings/CompanyProfile";
import TeamMembers from "@/components/settings/TeamMembers";
import NotificationMatrix from "@/components/settings/NotificationMatrix";
import IntegrationCard from "@/components/settings/IntegrationCard";
import AvailabilityEditor from "@/components/settings/AvailabilityEditor";
import AuditLog from "@/components/settings/AuditLog";
import { ProgressBar } from "@/components/ui/ProgressBar";

const SECTIONS = [
  { id: "company", label: "Company Profile", icon: Building2 },
  { id: "team", label: "Team Members", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "defaults", label: "Estimates & Invoices", icon: FileText },
  { id: "agents", label: "AI Agents", icon: Bot },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "audit", label: "Audit Log", icon: History },
  { id: "data", label: "Data Management", icon: Database },
];

const defaultCompanySettings: CompanySettings = {
  company_name: "The Finishing Touch LLC",
  phone: "(765) 555-0100",
  email: "evan@thefinishingtouchllc.com",
  address: "9909 East 100 South",
  city: "Greentown",
  state: "IN",
  zip: "46936",
  website: "https://thefinishingtouchllc.com",
  logo_url: null,
  google_review_url: "https://g.page/thefinishingtouch",
  service_area: "Howard County, IN and surrounding areas",
};

const demoIntegrations: IntegrationConfig[] = [
  { id: "int-1", provider: "stripe", label: "Stripe", description: "Payment processing and invoicing", status: "connected", last_activity: "2026-03-27T14:30:00Z" },
  { id: "int-2", provider: "google_calendar", label: "Google Calendar", description: "Two-way calendar sync", status: "connected", last_activity: "2026-03-28T08:00:00Z" },
  { id: "int-3", provider: "twilio", label: "Twilio (SMS)", description: "SMS notifications and reminders", status: "connected", last_activity: "2026-03-26T10:15:00Z" },
  { id: "int-4", provider: "google_places", label: "Google Places", description: "Address autocomplete", status: "connected", last_activity: null },
  { id: "int-5", provider: "gmail", label: "Gmail", description: "Outbound email via Resend relay", status: "connected", last_activity: "2026-03-28T07:45:00Z" },
  { id: "int-6", provider: "quickbooks", label: "QuickBooks Online", description: "Accounting sync for invoices", status: "not_connected", last_activity: null },
];

const demoAuditLog: AuditLogEntry[] = [
  { id: "al-1", user_name: "Evan Ellis", action: "Changed default margin", category: "Estimates", old_value: "25%", new_value: "30%", created_at: "2026-03-28T14:14:00Z" },
  { id: "al-2", user_name: "Evan Ellis", action: "Connected Stripe integration", category: "Integrations", old_value: null, new_value: "Connected", created_at: "2026-03-20T09:00:00Z" },
  { id: "al-3", user_name: "Evan Ellis", action: "Added Travis Cole as team member", category: "Team", old_value: null, new_value: "Crew role", created_at: "2026-03-01T08:00:00Z" },
  { id: "al-4", user_name: "Jake Henderson", action: "Changed payment terms", category: "Invoices", old_value: "Net 30", new_value: "Net 15", created_at: "2026-03-26T11:30:00Z" },
  { id: "al-5", user_name: "Evan Ellis", action: "Updated company phone", category: "Company", old_value: "(765) 555-0099", new_value: "(765) 555-0100", created_at: "2026-03-22T16:00:00Z" },
  { id: "al-6", user_name: "Evan Ellis", action: "Connected Google Calendar", category: "Integrations", old_value: null, new_value: "Connected", created_at: "2026-03-18T10:00:00Z" },
  { id: "al-7", user_name: "Evan Ellis", action: "Changed tax rate", category: "Invoices", old_value: "7%", new_value: "7%", created_at: "2026-03-15T09:00:00Z" },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("company");
  const [companySettings, setCompanySettings] = useState(defaultCompanySettings);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/team-members').then(r => r.json()),
      fetch('/api/settings/company').then(r => r.json()).catch(() => null),
    ])
      .then(([teamData, companyData]) => {
        setTeamMembers(teamData);
        if (companyData && !companyData.error) {
          setCompanySettings(companyData);
        }
      })
      .catch(console.error);
  }, []);
  const [defaultMargin, setDefaultMargin] = useState("25");
  const [defaultExpiration, setDefaultExpiration] = useState("30");
  const [taxRate, setTaxRate] = useState("7");
  const [invoiceFormat, setInvoiceFormat] = useState("TFT-{YYYY}-{####}");
  const [estimateFormat, setEstimateFormat] = useState("EST-{####}");
  const [paymentTerms, setPaymentTerms] = useState("net_30");
  const [defaultApprovalMode, setDefaultApprovalMode] = useState("requires_approval");
  const [businessHoursStart, setBusinessHoursStart] = useState("08:00");
  const [businessHoursEnd, setBusinessHoursEnd] = useState("18:00");
  const [agentSignature, setAgentSignature] = useState("- Evan Ellis, The Finishing Touch LLC | (765) 555-0100");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleAddMember = (member: Partial<TeamMember>) => {
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: member.name || "",
      email: member.email || "",
      role: member.role || "crew",
      phone: member.phone || null,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      notification_email: null,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setTeamMembers((prev) => [...prev, newMember]);
  };

  const handleDeactivate = (id: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_active: !m.is_active } : m))
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "company":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Company Profile</h2>
            <CompanyProfile settings={companySettings} onSave={setCompanySettings} />
          </div>
        );

      case "team":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Team Members</h2>
            <TeamMembers members={teamMembers} onAdd={handleAddMember} onDeactivate={handleDeactivate} />
          </div>
        );

      case "notifications":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Notification Preferences</h2>
            <NotificationMatrix />
          </div>
        );

      case "defaults":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Estimate and Invoice Defaults</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Default Margin (%)</label>
                  <input type="number" value={defaultMargin} onChange={(e) => setDefaultMargin(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Default Expiration (days)</label>
                  <input type="number" value={defaultExpiration} onChange={(e) => setDefaultExpiration(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tax Rate (%)</label>
                  <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputClass} />
                  <p className="mt-1 text-xs text-slate-400">Indiana default: 7%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Terms</label>
                  <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={inputClass}>
                    <option value="due_on_receipt">Due on Receipt</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Invoice Number Format</label>
                  <input type="text" value={invoiceFormat} onChange={(e) => setInvoiceFormat(e.target.value)} className={inputClass} />
                  <p className="mt-1 text-xs text-slate-400">Preview: TFT-2026-0001</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estimate Number Format</label>
                  <input type="text" value={estimateFormat} onChange={(e) => setEstimateFormat(e.target.value)} className={inputClass} />
                  <p className="mt-1 text-xs text-slate-400">Preview: EST-0001</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Default Terms and Conditions</label>
                <textarea
                  rows={4}
                  defaultValue="Payment is due within 30 days of invoice date. A late fee of 1.5% per month may be applied to overdue balances. All work is warranted for 2 years from completion date."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Instructions (Invoice PDF)</label>
                <textarea
                  rows={2}
                  defaultValue="Pay online via the link above, or mail checks to: The Finishing Touch LLC, 9909 East 100 South, Greentown, IN 46936"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">QuickBooks Export Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Default Income Account</label>
                    <input type="text" defaultValue="Services Revenue" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Default Tax Account</label>
                    <input type="text" defaultValue="Sales Tax Payable" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "agents":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">AI Agent Global Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Default Approval Mode</label>
                <div className="flex gap-2">
                  {["auto_send", "requires_approval"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDefaultApprovalMode(m)}
                      className={clsx(
                        "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                        defaultApprovalMode === m ? "border-[#0085FF] bg-[#0085FF]/10 text-[#0085FF]" : "border-slate-200 text-slate-500"
                      )}
                    >
                      {m === "auto_send" ? "Auto-Send" : "Require Approval"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business Hours Start</label>
                  <input type="time" value={businessHoursStart} onChange={(e) => setBusinessHoursStart(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business Hours End</label>
                  <input type="time" value={businessHoursEnd} onChange={(e) => setBusinessHoursEnd(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Business Days</label>
                <div className="flex gap-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                    <button
                      key={d}
                      className={clsx("rounded-lg px-3 py-2 text-xs font-medium", i < 5 ? "bg-[#0085FF] text-white" : "bg-slate-100 text-slate-400")}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Agent Email Signature</label>
                <textarea value={agentSignature} onChange={(e) => setAgentSignature(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
              </div>
            </div>
          </div>
        );

      case "integrations":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Integrations</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {demoIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => {}}
                  onDisconnect={() => {}}
                  onTest={async () => true}
                />
              ))}
            </div>
          </div>
        );

      case "availability":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Availability Rules</h2>
            <AvailabilityEditor teamMembers={teamMembers.filter((m) => m.is_active)} />
          </div>
        );

      case "billing":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Billing and Subscription</h2>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
              <p className="text-sm text-amber-700">Billing is coming soon. The platform is currently free during the beta period.</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Current Plan</p>
                    <p className="text-2xl font-bold text-[#0F172A]">Pro</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">Active</span>
                </div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Usage This Month</h3>
                <div className="space-y-3">
                  <ProgressBar value={3} max={5} label="Team Members" color="bg-[#0085FF]" />
                  <ProgressBar value={12} max={50} label="AI Vision Generations" color="bg-purple-500" />
                  <ProgressBar value={234} max={1000} label="Email Sends" color="bg-emerald-500" />
                  <ProgressBar value={18} max={100} label="SMS Sends" color="bg-amber-500" />
                  <ProgressBar value={156} max={1024} label="Storage (MB)" color="bg-slate-500" />
                </div>
              </div>
            </div>
          </div>
        );

      case "audit":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Audit Log</h2>
            <AuditLog entries={demoAuditLog} />
          </div>
        );

      case "data":
        return (
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Data Management</h2>
            <div className="space-y-6">
              {/* Export */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Export All Data</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Download all CRM data as a ZIP file containing CSV files for customers, leads, estimates, invoices, payments, and activities.
                </p>
                <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                  <Download className="h-4 w-4" /> Export All Data (ZIP)
                </button>
              </div>

              {/* Clear demo data */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="text-sm font-semibold text-amber-700 mb-3">Clear Demo Data</h3>
                <p className="text-sm text-amber-600 mb-4">
                  Remove all demo/seed data from the database. Real data you have entered will not be affected.
                </p>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Data Mode: Demo</span>
                  <button className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100">
                    Clear Demo Data
                  </button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Danger Zone
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  Permanently delete all CRM data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Trash2 className="mr-1.5 inline h-4 w-4" /> Reset CRM
                </button>
              </div>
            </div>

            {/* Delete confirmation */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-red-700">Reset CRM</h3>
                    <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    This will permanently delete ALL CRM data including customers, leads, invoices, and settings.
                    Type <span className="font-mono font-bold text-red-600">DELETE DEMO DATA</span> to confirm.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE DEMO DATA"
                    className={`${inputClass} mb-4`}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button
                      disabled={deleteConfirmText !== "DELETE DEMO DATA"}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete Everything
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your team and CRM configuration.</p>
      </div>

      <div className="flex gap-8">
        {/* Left nav */}
        <nav className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-8 space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-[#0085FF]/10 text-[#0085FF]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile section select */}
        <div className="lg:hidden mb-4 w-full">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value)}
            className={inputClass}
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
