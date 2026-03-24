"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  Plus,
  Calendar,
  Eye,
  MousePointerClick,
  UserMinus,
  Users,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";
import { demoCampaigns, demoEmailTemplates } from "@/lib/demo-data";
import { CAMPAIGN_STATUS_CONFIG } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MarketingCampaignsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? demoCampaigns
      : demoCampaigns.filter((c) => c.status === filter);

  const templateMap = new Map(demoEmailTemplates.map((t) => [t.id, t]));
  const detailCampaign = showDetail ? demoCampaigns.find((c) => c.id === showDetail) : null;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and manage email campaigns to your contact segments.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[#0d1526] p-1 w-fit">
        <Link href="/marketing/contacts" className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">
          Contacts
        </Link>
        <Link href="/marketing/templates" className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">
          Templates
        </Link>
        <Link href="/marketing/campaigns" className="rounded-md bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-400">
          Campaigns
        </Link>
        <Link href="/marketing/automations" className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">
          Automations
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {["all", "draft", "scheduled", "sending", "sent"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? "bg-blue-600/20 text-blue-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaign list */}
      <div className="space-y-4">
        {filtered.map((campaign) => {
          const template = templateMap.get(campaign.template_id);
          const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status];
          return (
            <div
              key={campaign.id}
              className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-white">
                      {campaign.name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Template: {template?.name ?? "Unknown"} · Audience:{" "}
                    {campaign.segment_tags.length > 0
                      ? campaign.segment_tags.join(", ")
                      : "All contacts"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === "draft" && (
                    <button className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                      <Send className="h-3 w-3" />
                      Send Test
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetail(showDetail === campaign.id ? null : campaign.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${showDetail === campaign.id ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {campaign.recipients_count} recipients
                </div>
                {campaign.status === "sent" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      {campaign.opens} opens
                      {campaign.recipients_count > 0 && (
                        <span className="text-slate-600">
                          ({Math.round((campaign.opens / campaign.recipients_count) * 100)}%)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MousePointerClick className="h-3.5 w-3.5" />
                      {campaign.clicks} clicks
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserMinus className="h-3.5 w-3.5" />
                      {campaign.unsubscribes} unsubs
                    </div>
                  </>
                )}
                {campaign.scheduled_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {campaign.sent_at
                      ? `Sent ${formatDate(campaign.sent_at)}`
                      : `Scheduled ${formatDate(campaign.scheduled_at)}`}
                  </div>
                )}
              </div>

              {/* Expanded detail */}
              {showDetail === campaign.id && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Open Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-700/50">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{
                              width: `${campaign.recipients_count > 0 ? (campaign.opens / campaign.recipients_count) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {campaign.recipients_count > 0
                            ? Math.round((campaign.opens / campaign.recipients_count) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Click Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-700/50">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{
                              width: `${campaign.recipients_count > 0 ? (campaign.clicks / campaign.recipients_count) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {campaign.recipients_count > 0
                            ? Math.round((campaign.clicks / campaign.recipients_count) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
