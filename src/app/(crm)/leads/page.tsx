"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import PipelineBoard from "@/components/PipelineBoard";
import { demoLeads, demoCustomers } from "@/lib/demo-data";
import type { Lead, LeadStatus } from "@/lib/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [search, setSearch] = useState("");

  const customerMap = new Map(demoCustomers.map((c) => [c.id, c]));

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const customer = customerMap.get(lead.customer_id);
    return (
      lead.project_type?.toLowerCase().includes(q) ||
      customer?.name.toLowerCase().includes(q) ||
      lead.project_description?.toLowerCase().includes(q)
    );
  });

  function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Lead Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            {leads.length} total leads &middot; Drag cards to update status
          </p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 rounded-lg bg-[#0085FF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0177E3]"
        >
          <Plus className="h-4 w-4" />
          New Lead
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads by name, project, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#0085FF] focus:outline-none focus:ring-1 focus:ring-[#0085FF]"
          />
        </div>
      </div>

      <PipelineBoard
        leads={filteredLeads}
        customers={demoCustomers}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
