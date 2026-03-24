"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, User, GripVertical } from "lucide-react";
import type { Lead, LeadStatus, Customer } from "@/lib/types";
import { LEAD_STATUS_CONFIG, PIPELINE_STAGES } from "@/lib/types";

interface PipelineBoardProps {
  leads: Lead[];
  customers: Customer[];
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

export default function PipelineBoard({
  leads,
  customers,
  onStatusChange,
}: PipelineBoardProps) {
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const leadsByStage = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => l.status === stage);
      return acc;
    },
    {} as Record<LeadStatus, Lead[]>
  );

  function handleDragStart(leadId: string) {
    setDraggedLead(leadId);
  }

  function handleDragOver(e: React.DragEvent, stage: LeadStatus) {
    e.preventDefault();
    setDragOverStage(stage);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  function handleDrop(stage: LeadStatus) {
    if (draggedLead && onStatusChange) {
      onStatusChange(draggedLead, stage);
    }
    setDraggedLead(null);
    setDragOverStage(null);
  }

  function formatAmount(amount: number | null) {
    if (amount === null) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const config = LEAD_STATUS_CONFIG[stage];
        const stageLeads = leadsByStage[stage];
        const stageTotal = stageLeads.reduce(
          (sum, l) => sum + (l.quoted_amount ?? 0),
          0
        );

        return (
          <div
            key={stage}
            className={`flex min-w-[280px] flex-col rounded-xl border transition-colors ${
              dragOverStage === stage
                ? "border-blue-500 bg-blue-500/5"
                : "border-slate-700/50 bg-[#0d1526]"
            }`}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(stage)}
          >
            <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${config.bgColor.replace("/20", "")}`}
                />
                <span className="text-sm font-semibold text-slate-200">
                  {config.label}
                </span>
                <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
                  {stageLeads.length}
                </span>
              </div>
              {stageTotal > 0 && (
                <span className="text-xs text-slate-500">
                  {formatAmount(stageTotal)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 p-3 min-h-[100px]">
              {stageLeads.map((lead) => {
                const customer = customerMap.get(lead.customer_id);
                return (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    className={`group cursor-grab rounded-lg border border-slate-700/50 bg-[#111a2e] p-3 transition-all hover:border-slate-600 active:cursor-grabbing ${
                      draggedLead === lead.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                        {lead.project_type}
                      </p>
                      <GripVertical className="h-4 w-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {customer && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <User className="h-3 w-3" />
                        {customer.name}
                      </div>
                    )}
                    {lead.quoted_amount && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <DollarSign className="h-3 w-3" />
                        {formatAmount(lead.quoted_amount)}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
