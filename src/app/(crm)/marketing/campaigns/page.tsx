"use client";

import { useState } from "react";
import {
  Send, Plus, Calendar, Eye, MousePointerClick, UserMinus, Users, ChevronDown,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import MarketingNav from "@/components/ui/MarketingNav";
import { demoCampaigns, demoEmailTemplates } from "@/lib/demo-data";
import { CAMPAIGN_STATUS_CONFIG } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function MarketingCampaignsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const filtered = filter === "all" ? demoCampaigns : demoCampaigns.filter((c) => c.status === filter);
  const templateMap = new Map(demoEmailTemplates.map((t) => [t.id, t]));

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Campaigns"
        subtitle="Create and manage email campaigns to your contact segments."
        action={
          <Button>
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        }
      />

      <MarketingNav />

      <div className="mb-6 flex gap-2">
        {["all", "draft", "scheduled", "sending", "sent"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s ? "bg-brand/10 text-brand" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((campaign) => {
          const template = templateMap.get(campaign.template_id);
          const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status];
          return (
            <div key={campaign.id} className="rounded-xl border border-slate-200 bg-surface shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Template: {template?.name ?? "Unknown"} &middot; Audience:{" "}
                    {campaign.segment_tags.length > 0 ? campaign.segment_tags.join(", ") : "All contacts"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === "draft" && (
                    <Button className="!px-3 !py-1.5 !text-xs"><Send className="h-3 w-3" />Send Test</Button>
                  )}
                  <button
                    onClick={() => setShowDetail(showDetail === campaign.id ? null : campaign.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${showDetail === campaign.id ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{campaign.recipients_count} recipients</div>
                {campaign.status === "sent" && (
                  <>
                    <div className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{campaign.opens} opens {campaign.recipients_count > 0 && <span className="text-slate-300">({Math.round((campaign.opens / campaign.recipients_count) * 100)}%)</span>}</div>
                    <div className="flex items-center gap-1.5"><MousePointerClick className="h-3.5 w-3.5" />{campaign.clicks} clicks</div>
                    <div className="flex items-center gap-1.5"><UserMinus className="h-3.5 w-3.5" />{campaign.unsubscribes} unsubs</div>
                  </>
                )}
                {campaign.scheduled_at && (
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{campaign.sent_at ? `Sent ${formatDate(campaign.sent_at)}` : `Scheduled ${formatDate(campaign.scheduled_at)}`}</div>
                )}
              </div>

              {showDetail === campaign.id && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Open Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-brand" style={{ width: `${campaign.recipients_count > 0 ? (campaign.opens / campaign.recipients_count) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{campaign.recipients_count > 0 ? Math.round((campaign.opens / campaign.recipients_count) * 100) : 0}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Click Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${campaign.recipients_count > 0 ? (campaign.clicks / campaign.recipients_count) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{campaign.recipients_count > 0 ? Math.round((campaign.clicks / campaign.recipients_count) * 100) : 0}%</span>
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
