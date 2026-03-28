"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, User, GripVertical } from "lucide-react";
import { clsx } from "clsx";
import type { Lead, LeadStatus, Customer } from "@/lib/types";
import { LEAD_STATUS_CONFIG, PIPELINE_STAGES } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import Select from "@/components/ui/Select";

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
            className={clsx(
              "flex min-w-[280px] flex-col rounded-xl border transition-colors",
              dragOverStage === stage
                ? "border-brand bg-brand/5"
                : "border-slate-200 bg-slate-50"
            )}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(stage)}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${config.bgColor.replace("/20", "")}`}
                />
                <span className="text-sm font-semibold text-foreground">
                  {config.label}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  {stageLeads.length}
                </span>
              </div>
              {stageTotal > 0 && (
                <span className="text-xs text-slate-500">
                  {formatCurrency(stageTotal)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 p-3 min-h-[100px]">
              {stageLeads.map((lead) => {
                const customer = customerMap.get(lead.customer_id);
                return (
                  <div key={lead.id} className="relative">
                    <Link
                      href={`/leads/${lead.id}`}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      className={clsx(
                        "group block cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-brand/30 hover:shadow-md active:cursor-grabbing",
                        draggedLead === lead.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-foreground group-hover:text-brand">
                          {lead.project_type}
                        </p>
                        <GripVertical className="hidden h-4 w-4 text-slate-300 group-hover:block lg:opacity-0 lg:group-hover:opacity-100 lg:block transition-opacity" />
                      </div>
                      {customer && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          {customer.name}
                        </div>
                      )}
                      {lead.quoted_amount && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(lead.quoted_amount)}
                        </div>
                      )}
                    </Link>
                    {/* Touch fallback: status selector */}
                    {onStatusChange && (
                      <div className="mt-1 lg:hidden">
                        <Select
                          value={lead.status}
                          onChange={(e) =>
                            onStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          className="!py-1.5 !text-xs"
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {LEAD_STATUS_CONFIG[s].label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
