"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Link2,
  MousePointerClick,
  DollarSign,
  Trophy,
  Copy,
  Plus,
  X,
  Send,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import clsx from "clsx";
import StatsCard from "@/components/StatsCard";
import type { Referral } from "@/lib/types";

const MARKETING_TABS = [
  { href: "/marketing/contacts", label: "Contacts" },
  { href: "/marketing/templates", label: "Templates" },
  { href: "/marketing/campaigns", label: "Campaigns" },
  { href: "/marketing/automations", label: "Automations" },
  { href: "/marketing/referrals", label: "Referrals" },
];

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });

const demoReferrals: Referral[] = [
  { id: "ref-1", referrer_id: "c-1", referrer_name: "Steve Morales", referred_name: "John Peterson", referred_email: "jpeterson@gmail.com", referred_phone: "(765) 555-2001", code: "STEVE2026", status: "booked", created_at: "2026-03-10T10:00:00Z" },
  { id: "ref-2", referrer_id: "c-1", referrer_name: "Steve Morales", referred_name: "Amy Collins", referred_email: "acollins@yahoo.com", referred_phone: null, code: "STEVE2026", status: "contacted", created_at: "2026-03-15T14:00:00Z" },
  { id: "ref-3", referrer_id: "c-4", referrer_name: "Tom Marshall", referred_name: "Rick Davis", referred_email: "rdavis@gmail.com", referred_phone: "(765) 555-3001", code: "TOM2026", status: "completed", created_at: "2026-02-20T09:00:00Z" },
  { id: "ref-4", referrer_id: "c-7", referrer_name: "Jim Nesbitt", referred_name: "Laura Chen", referred_email: "lchen@outlook.com", referred_phone: null, code: "JIM2026", status: "pending", created_at: "2026-03-22T16:00:00Z" },
  { id: "ref-5", referrer_id: "c-4", referrer_name: "Tom Marshall", referred_name: "Sarah White", referred_email: "swhite@gmail.com", referred_phone: "(317) 555-4001", code: "TOM2026", status: "booked", created_at: "2026-03-01T11:00:00Z" },
];

const statusColors: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-slate-500", bg: "bg-slate-100" },
  contacted: { label: "Contacted", color: "text-blue-600", bg: "bg-blue-50" },
  booked: { label: "Booked", color: "text-emerald-600", bg: "bg-emerald-50" },
  completed: { label: "Completed", color: "text-green-600", bg: "bg-green-50" },
};

export default function MarketingReferralsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Leaderboard
  const leaderboard = Object.values(
    demoReferrals.reduce<Record<string, { name: string; count: number; booked: number }>>((acc, ref) => {
      if (!acc[ref.referrer_name]) acc[ref.referrer_name] = { name: ref.referrer_name, count: 0, booked: 0 };
      acc[ref.referrer_name].count++;
      if (ref.status === "booked" || ref.status === "completed") acc[ref.referrer_name].booked++;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  const totalLinks = new Set(demoReferrals.map((r) => r.code)).size;
  const totalLeads = demoReferrals.length;
  const totalBooked = demoReferrals.filter((r) => r.status === "booked" || r.status === "completed").length;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(`https://thefinishingtouchllc.com/ref/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-work-sans)" }}>Referral Program</h1>
          <p className="mt-1 text-sm text-slate-500">Track referrals from happy customers.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">
          <Plus className="h-4 w-4" /> New Referral Campaign
        </button>
      </div>

      {/* Sub-nav */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {MARKETING_TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={clsx("rounded-md px-4 py-2 text-sm font-medium", tab.href === "/marketing/referrals" ? "bg-[#0085FF]/10 text-[#0085FF]" : "text-slate-500 hover:text-slate-700")}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Referral Links" value={totalLinks} icon={Link2} color="blue" />
        <StatsCard title="Total Referrals" value={totalLeads} icon={Users} color="purple" />
        <StatsCard title="Jobs Booked" value={totalBooked} icon={TrendingUp} color="emerald" />
        <StatsCard title="Est. Revenue" value={fmt.format(totalBooked * 5200)} icon={DollarSign} color="orange" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Leaderboard */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Referral Leaderboard
          </h2>
          <div className="space-y-3">
            {leaderboard.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                    i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : "bg-amber-700"
                  )}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{entry.name}</p>
                    <p className="text-xs text-slate-400">{entry.count} referral{entry.count !== 1 ? "s" : ""} -- {entry.booked} booked</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral List */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-[#0F172A]">All Referrals</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase text-slate-500">
                <th className="px-6 py-3 text-left">Referred By</th>
                <th className="px-6 py-3 text-left">New Lead</th>
                <th className="px-6 py-3 text-left">Code</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demoReferrals.map((ref) => {
                const sc = statusColors[ref.status];
                return (
                  <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-slate-700">{ref.referrer_name}</td>
                    <td className="px-6 py-3">
                      <p className="text-sm text-slate-700">{ref.referred_name}</p>
                      <p className="text-xs text-slate-400">{ref.referred_email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <button onClick={() => handleCopy(ref.code)} className="flex items-center gap-1 text-xs text-[#0085FF] hover:text-[#0177E3]">
                        <Copy className="h-3 w-3" />
                        {copiedCode === ref.code ? "Copied!" : ref.code}
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.color} ${sc.bg}`}>{sc.label}</span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">{new Date(ref.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0F172A]">New Referral Campaign</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
                <input type="text" placeholder="e.g. Spring Referral Program" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                <select className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#0085FF] focus:outline-none">
                  <option>All Past Customers</option>
                  <option>Top 20 Customers</option>
                  <option>Completed Jobs (Last 6 Months)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reward</label>
                <input type="text" placeholder="e.g. $50 gift card per booked referral" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0177E3]">
                <Send className="mr-1.5 inline h-3.5 w-3.5" /> Launch Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
