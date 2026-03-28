"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
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
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Lead Pipeline"
        subtitle={`${leads.length} total leads \u00B7 Drag cards to update status`}
        action={
          <Button href="/customers/new">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        }
      />

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search leads by name, project, or description..."
          className="max-w-md"
        />
      </div>

      <PipelineBoard
        leads={filteredLeads}
        customers={demoCustomers}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
