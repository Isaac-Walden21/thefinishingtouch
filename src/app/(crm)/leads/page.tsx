"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  X,
  Phone,
  MessageSquare,
  Mail,
  StickyNote,
  CalendarPlus,
  Calculator,
  ExternalLink,
  User,
  DollarSign,
  GripVertical,
  Filter,
  Users,
  ArrowUpDown,
  CheckSquare,
} from "lucide-react";
import clsx from "clsx";
import { SlideOver } from "@/components/SlideOver";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import type { Lead, LeadStatus, Customer, TeamMember } from "@/lib/types";
import { LEAD_STATUS_CONFIG, PIPELINE_STAGES } from "@/lib/types";
import { formatCurrency, formatTimeAgo } from "@/lib/format";

type SortOption = "amount" | "age" | "activity" | "name";

const SOURCE_OPTIONS = [
  "Google",
  "Facebook",
  "Website",
  "Referral",
  "Yard Sign",
  "Phone Call",
  "Vapi",
];
const PROJECT_TYPE_OPTIONS = [
  "Concrete Patio",
  "Driveway",
  "Stamped Concrete",
  "Post Frame",
  "Landscaping",
  "Curbing",
  "Firewood",
];
const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Last 30 Days", value: "30d" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [projectTypeFilter, setProjectTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("age");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/team-members').then(r => r.json()),
    ])
      .then(([leadsData, customersData, teamData]) => {
        setLeads(leadsData);
        setCustomers(customersData);
        setTeam(teamData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers]
  );
  const teamMap = useMemo(
    () => new Map(team.map((t) => [t.id, t])),
    [team]
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-[var(--muted)]">Loading...</div>
    </div>
  );

  const hasFilters = search || assigneeFilter.length > 0 || projectTypeFilter || sourceFilter || dateRange;

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const customer = customerMap.get(lead.customer_id);
      if (search) {
        const q = search.toLowerCase();
        const match =
          lead.project_type?.toLowerCase().includes(q) ||
          customer?.name.toLowerCase().includes(q) ||
          lead.project_description?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (assigneeFilter.length > 0 && !assigneeFilter.includes(lead.assigned_to ?? "")) return false;
      if (projectTypeFilter && !lead.project_type?.toLowerCase().includes(projectTypeFilter.toLowerCase())) return false;
      if (sourceFilter && customer?.source !== sourceFilter) return false;
      if (dateRange) {
        const d = new Date(lead.created_at);
        const now = new Date();
        if (dateRange === "today" && d.toDateString() !== now.toDateString()) return false;
        if (dateRange === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 86400000);
          if (d < weekAgo) return false;
        }
        if (dateRange === "month" && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
        if (dateRange === "30d") {
          const ago = new Date(now.getTime() - 30 * 86400000);
          if (d < ago) return false;
        }
      }
      return true;
    });
  }, [leads, search, assigneeFilter, projectTypeFilter, sourceFilter, dateRange, customerMap]);

  function sortLeads(stageLeads: Lead[]): Lead[] {
    return [...stageLeads].sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return (b.quoted_amount ?? 0) - (a.quoted_amount ?? 0);
        case "age":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "activity":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "name": {
          const an = customerMap.get(a.customer_id)?.name ?? "";
          const bn = customerMap.get(b.customer_id)?.name ?? "";
          return an.localeCompare(bn);
        }
        default:
          return 0;
      }
    });
  }

  function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  }

  function getAgeIndicator(lead: Lead): { color: string; label: string } {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(lead.updated_at).getTime()) / 86400000
    );
    if (daysSinceUpdate < 2) return { color: "bg-emerald-500", label: "Fresh" };
    if (daysSinceUpdate < 7) return { color: "bg-amber-500", label: "Aging" };
    return { color: "bg-red-500", label: "Stale" };
  }

  function openLeadSlideOver(lead: Lead) {
    setSelectedLead(lead);
    setSlideOverOpen(true);
    setNoteText("");
  }

  function clearFilters() {
    setSearch("");
    setAssigneeFilter([]);
    setProjectTypeFilter("");
    setSourceFilter("");
    setDateRange("");
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Pipeline value totals (exclude Completed and Lost)
  const activePipeline = filteredLeads.filter(
    (l) => !["completed", "lost"].includes(l.status)
  );
  const pipelineValue = activePipeline.reduce(
    (s, l) => s + (l.quoted_amount ?? 0),
    0
  );

  const selectedCustomer = selectedLead
    ? customerMap.get(selectedLead.customer_id)
    : null;

  // Drag & drop state
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="Lead Pipeline"
        subtitle={`${filteredLeads.length} leads | Pipeline Value: ${formatCurrency(pipelineValue)} across ${activePipeline.length} active leads`}
        actions={
          <button
            onClick={() => setAddLeadOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value && !assigneeFilter.includes(e.target.value)) {
              setAssigneeFilter([...assigneeFilter, e.target.value]);
            }
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
        >
          <option value="">Assignee</option>
          {team.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={projectTypeFilter}
          onChange={(e) => setProjectTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
        >
          <option value="">Project Type</option>
          {PROJECT_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
        >
          {DATE_RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none"
        >
          <option value="">Source</option>
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600 focus:border-brand focus:outline-none"
          >
            <option value="age">Oldest First</option>
            <option value="amount">Highest Amount</option>
            <option value="activity">Recent Activity</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Filter Chips */}
      {hasFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              Search: {search}
              <button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          {assigneeFilter.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {teamMap.get(id)?.name}
              <button onClick={() => setAssigneeFilter(assigneeFilter.filter((a) => a !== id))}><X className="h-3 w-3" /></button>
            </span>
          ))}
          {projectTypeFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {projectTypeFilter}
              <button onClick={() => setProjectTypeFilter("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          {sourceFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {sourceFilter}
              <button onClick={() => setSourceFilter("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          {dateRange && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label}
              <button onClick={() => setDateRange("")}><X className="h-3 w-3" /></button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3">
          <CheckSquare className="h-4 w-4 text-brand" />
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <select className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:outline-none">
              <option value="">Reassign to...</option>
              {team.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:outline-none">
              <option value="">Change status...</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{LEAD_STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <button className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-100">
              Archive
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const config = LEAD_STATUS_CONFIG[stage];
          const stageLeads = sortLeads(
            filteredLeads.filter((l) => l.status === stage)
          );
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
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => {
                if (draggedLead) {
                  handleStatusChange(draggedLead, stage);
                  setDraggedLead(null);
                  setDragOverStage(null);
                }
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      "h-2.5 w-2.5 rounded-full",
                      config.bgColor.replace("/20", "")
                    )}
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
                {stage === "new" && (
                  <button
                    onClick={() => setAddLeadOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:border-brand hover:text-brand"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Lead
                  </button>
                )}
                {stageLeads.map((lead) => {
                  const customer = customerMap.get(lead.customer_id);
                  const age = getAgeIndicator(lead);
                  const assignee = lead.assigned_to
                    ? teamMap.get(lead.assigned_to)
                    : null;
                  const isSelected = selectedIds.has(lead.id);

                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDraggedLead(lead.id)}
                      onClick={() => openLeadSlideOver(lead)}
                      className={clsx(
                        "group cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:border-brand/30 hover:shadow-md active:cursor-grabbing",
                        draggedLead === lead.id ? "opacity-50" : "",
                        isSelected ? "border-brand bg-brand/5" : "border-slate-200"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(lead.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <p className="text-sm font-medium text-foreground">
                            {lead.project_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clsx("h-2 w-2 rounded-full", age.color)}
                            title={age.label}
                          />
                          <GripVertical className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      {customer && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          {customer.name}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        {lead.quoted_amount ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(lead.quoted_amount)}
                          </div>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-1.5">
                          {customer?.source && (
                            <Badge
                              label={customer.source}
                              color="text-slate-500"
                              bgColor="bg-slate-100"
                            />
                          )}
                          {assignee && (
                            <div
                              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                              style={{ backgroundColor: assignee.color }}
                              title={assignee.name}
                            >
                              {assignee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Quick Action SlideOver */}
      <SlideOver
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title={selectedLead?.project_type ?? "Lead Details"}
      >
        {selectedLead && selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Customer</h3>
              <p className="text-sm font-semibold text-foreground">
                {selectedCustomer.name}
              </p>
              {selectedCustomer.phone && (
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="mt-1 block text-sm text-brand hover:underline"
                >
                  {selectedCustomer.phone}
                </a>
              )}
              {selectedCustomer.email && (
                <a
                  href={`mailto:${selectedCustomer.email}`}
                  className="mt-0.5 block text-sm text-brand hover:underline"
                >
                  {selectedCustomer.email}
                </a>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              {selectedCustomer.phone && (
                <>
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-brand/30 hover:text-brand transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                  <a
                    href={`sms:${selectedCustomer.phone}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-brand/30 hover:text-brand transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Text
                  </a>
                </>
              )}
              <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-brand/30 hover:text-brand transition-colors">
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-brand/30 hover:text-brand transition-colors">
                <CalendarPlus className="h-4 w-4" />
                Schedule Visit
              </button>
              <Link
                href={`/estimates/new?customer=${selectedLead.customer_id}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-brand/30 hover:text-brand transition-colors"
              >
                <Calculator className="h-4 w-4" />
                Create Estimate
              </Link>
              <Link
                href={`/leads/${selectedLead.id}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-brand/30 hover:text-brand transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Full Details
              </Link>
            </div>

            {/* Add Note */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Add Note</h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type a note..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
              <button
                disabled={!noteText.trim()}
                className="mt-2 flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                <StickyNote className="h-3.5 w-3.5" />
                Save Note
              </button>
            </div>

            {/* Lead Details */}
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Lead Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    <Badge
                      label={LEAD_STATUS_CONFIG[selectedLead.status].label}
                      color={LEAD_STATUS_CONFIG[selectedLead.status].color}
                      bgColor={LEAD_STATUS_CONFIG[selectedLead.status].bgColor}
                    />
                  </dd>
                </div>
                {selectedLead.quoted_amount && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Quoted</dt>
                    <dd className="font-medium text-emerald-600">
                      {formatCurrency(selectedLead.quoted_amount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Created</dt>
                  <dd className="text-slate-700">{formatTimeAgo(selectedLead.created_at)}</dd>
                </div>
                {selectedLead.assigned_to && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Assigned</dt>
                    <dd className="text-slate-700">{teamMap.get(selectedLead.assigned_to)?.name}</dd>
                  </div>
                )}
              </dl>
              {selectedLead.project_description && (
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {selectedLead.project_description}
                </p>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Add Lead SlideOver */}
      <SlideOver
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        title="Add New Lead"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setAddLeadOpen(false);
          }}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Customer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Smith"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              placeholder="(765) 555-0000"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Project Type
            </label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none">
              <option value="">Select...</option>
              {PROJECT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Source
            </label>
            <select className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-brand focus:outline-none">
              <option value="">Select...</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Quick notes..."
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" />
              Create Lead
            </button>
            <button
              type="button"
              onClick={() => setAddLeadOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
