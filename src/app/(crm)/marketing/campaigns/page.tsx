"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Plus,
  Calendar,
  Eye,
  MousePointerClick,
  UserMinus,
  Users,
  ChevronDown,
  X,
  MessageSquare,
  ArrowRight,
  BarChart3,
  Mail,
} from "lucide-react";
import clsx from "clsx";
import { CAMPAIGN_STATUS_CONFIG } from "@/lib/types";
import type { Campaign, EmailTemplate, MarketingContact } from "@/lib/types";

const MARKETING_TABS = [
  { href: "/marketing/contacts", label: "Contacts" },
  { href: "/marketing/templates", label: "Templates" },
  { href: "/marketing/campaigns", label: "Campaigns" },
  { href: "/marketing/automations", label: "Automations" },
  { href: "/marketing/referrals", label: "Referrals" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MarketingCampaignsPage() {
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [allTemplates, setAllTemplates] = useState<EmailTemplate[]>([]);
  const [allContacts, setAllContacts] = useState<MarketingContact[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/marketing/campaigns').then(r => r.json()),
      fetch('/api/marketing/templates').then(r => r.json()),
      fetch('/api/marketing/contacts').then(r => r.json()),
    ])
      .then(([campaignsData, templatesData, contactsData]) => {
        setAllCampaigns(campaignsData);
        setAllTemplates(templatesData);
        setAllContacts(contactsData);
      })
      .catch(console.error);
  }, []);

  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "email" | "sms">("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [campaignType, setCampaignType] = useState<"email" | "sms">("email");
  const [abTest, setAbTest] = useState(false);

  const filtered = allCampaigns.filter((c) => filter === "all" || c.status === filter);
  const templateMap = new Map(allTemplates.map((t) => [t.id, t]));

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage email and SMS campaigns.</p>
        </div>
        <button onClick={() => { setShowCreate(true); setCreateStep(1); }} className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]">
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Sub-nav */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {MARKETING_TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={clsx("rounded-md px-4 py-2 text-sm font-medium", tab.href === "/marketing/campaigns" ? "bg-[#0085FF]/10 text-[#0085FF]" : "text-slate-500 hover:text-slate-700")}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex gap-2">
          {["all", "draft", "scheduled", "sending", "sent"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={clsx("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", filter === s ? "bg-[#0085FF]/10 text-[#0085FF]" : "text-slate-500 hover:text-slate-700")}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-200 p-0.5">
          {(["all", "email", "sms"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={clsx("rounded-md px-3 py-1 text-xs font-medium transition-colors", typeFilter === t ? "bg-[#0085FF] text-white" : "text-slate-500")}>
              {t === "all" ? "All" : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign list */}
      <div className="space-y-4">
        {filtered.map((campaign) => {
          const template = templateMap.get(campaign.template_id);
          const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status];
          const isExpanded = showDetail === campaign.id;

          return (
            <div key={campaign.id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-[#0F172A]">{campaign.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Template: {template?.name ?? "Unknown"} -- Audience: {campaign.segment_tags.length > 0 ? campaign.segment_tags.join(", ") : "All contacts"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === "draft" && (
                    <button className="flex items-center gap-1 rounded-lg bg-[#0085FF] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0177E3]">
                      <Send className="h-3 w-3" /> Send Test
                    </button>
                  )}
                  <button onClick={() => setShowDetail(isExpanded ? null : campaign.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                    <ChevronDown className={clsx("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {campaign.recipients_count} recipients</div>
                {campaign.status === "sent" && (
                  <>
                    <div className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {campaign.opens} opens ({campaign.recipients_count > 0 ? Math.round((campaign.opens / campaign.recipients_count) * 100) : 0}%)</div>
                    <div className="flex items-center gap-1.5"><MousePointerClick className="h-3.5 w-3.5" /> {campaign.clicks} clicks</div>
                    <div className="flex items-center gap-1.5"><UserMinus className="h-3.5 w-3.5" /> {campaign.unsubscribes} unsubs</div>
                  </>
                )}
                {campaign.scheduled_at && (
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {campaign.sent_at ? `Sent ${formatDate(campaign.sent_at)}` : `Scheduled ${formatDate(campaign.scheduled_at)}`}</div>
                )}
              </div>

              {/* Expanded analytics */}
              {isExpanded && campaign.status === "sent" && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Open Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-[#0085FF]" style={{ width: `${campaign.recipients_count > 0 ? (campaign.opens / campaign.recipients_count) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{campaign.recipients_count > 0 ? Math.round((campaign.opens / campaign.recipients_count) * 100) : 0}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Click Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${campaign.recipients_count > 0 ? (campaign.clicks / campaign.recipients_count) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{campaign.recipients_count > 0 ? Math.round((campaign.clicks / campaign.recipients_count) * 100) : 0}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Unsubscribe Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-red-500" style={{ width: `${campaign.recipients_count > 0 ? (campaign.unsubscribes / campaign.recipients_count) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{campaign.recipients_count > 0 ? Math.round((campaign.unsubscribes / campaign.recipients_count) * 100) : 0}%</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-xs text-[#0085FF] hover:underline">View Contact-Level Details</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Campaign Creation Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#0F172A]">New Campaign -- Step {createStep} of 5</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            {/* Steps indicator */}
            <div className="mb-6 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={clsx("h-1.5 w-full rounded-full", s <= createStep ? "bg-[#0085FF]" : "bg-slate-200")} />
                </div>
              ))}
            </div>

            {/* Step content */}
            {createStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Campaign Type</p>
                <div className="flex gap-3">
                  <button onClick={() => setCampaignType("email")} className={clsx("flex-1 rounded-lg border p-4 text-center transition-colors", campaignType === "email" ? "border-[#0085FF] bg-[#0085FF]/5" : "border-slate-200")}>
                    <Mail className="mx-auto h-6 w-6 text-[#0085FF] mb-2" />
                    <p className="text-sm font-medium text-slate-700">Email</p>
                  </button>
                  <button onClick={() => setCampaignType("sms")} className={clsx("flex-1 rounded-lg border p-4 text-center transition-colors", campaignType === "sms" ? "border-[#0085FF] bg-[#0085FF]/5" : "border-slate-200")}>
                    <MessageSquare className="mx-auto h-6 w-6 text-[#0085FF] mb-2" />
                    <p className="text-sm font-medium text-slate-700">SMS</p>
                  </button>
                </div>
                {campaignType === "email" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Template</label>
                    <select className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none">
                      <option value="">Choose a template...</option>
                      {allTemplates.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Select Audience</p>
                <p className="text-xs text-slate-400">Choose tags to target specific segments</p>
                <div className="flex flex-wrap gap-2">
                  {["past-customer", "active-lead", "concrete", "driveway", "landscaping"].map((tag) => (
                    <button key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 hover:bg-[#0085FF] hover:text-white">{tag}</button>
                  ))}
                </div>
                <p className="text-sm text-slate-600">Matching contacts: <span className="font-medium">{allContacts.length}</span></p>
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject Line</label>
                  <input type="text" placeholder="Enter subject line..." className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none" />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={abTest} onChange={(e) => setAbTest(e.target.checked)} className="rounded border-slate-300 text-[#0085FF]" />
                  Enable A/B Test
                </label>
                {abTest && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <input type="text" placeholder="Subject B..." className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none" />
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div><label className="text-slate-500">Test %</label><input type="number" defaultValue={10} className="mt-1 w-full rounded border px-2 py-1 text-sm" /></div>
                      <div><label className="text-slate-500">Wait (hrs)</label><input type="number" defaultValue={2} className="mt-1 w-full rounded border px-2 py-1 text-sm" /></div>
                      <div><label className="text-slate-500">Winner by</label><select className="mt-1 w-full rounded border px-2 py-1 text-sm"><option>Open Rate</option><option>Click Rate</option></select></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {createStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Review Campaign</p>
                <div className="rounded-lg border border-slate-200 p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-slate-700 capitalize">{campaignType}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Recipients</span><span className="text-slate-700">{allContacts.length} contacts</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">A/B Test</span><span className="text-slate-700">{abTest ? "Enabled" : "Disabled"}</span></div>
                </div>
              </div>
            )}

            {createStep === 5 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Schedule or Send</p>
                <div className="flex gap-3">
                  <button className="flex-1 rounded-lg border border-[#0085FF] bg-[#0085FF]/5 p-4 text-center">
                    <Send className="mx-auto h-6 w-6 text-[#0085FF] mb-2" />
                    <p className="text-sm font-medium text-[#0085FF]">Send Now</p>
                  </button>
                  <button className="flex-1 rounded-lg border border-slate-200 p-4 text-center hover:border-[#0085FF]/30">
                    <Calendar className="mx-auto h-6 w-6 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Schedule</p>
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-between">
              {createStep > 1 ? (
                <button onClick={() => setCreateStep(createStep - 1)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Back</button>
              ) : (
                <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              )}
              {createStep < 5 ? (
                <button onClick={() => setCreateStep(createStep + 1)} className="flex items-center gap-1 rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => setShowCreate(false)} className="rounded-lg bg-[#0085FF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">
                  Create Campaign
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
