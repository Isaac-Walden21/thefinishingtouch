"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Printer,
  Pencil,
} from "lucide-react";
import { demoEstimates, demoCustomers } from "@/lib/demo-data";
import {
  ESTIMATE_STATUS_CONFIG,
  type EstimateStatus,
} from "@/lib/types";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

export default function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const estimate = demoEstimates.find((e) => e.id === id);
  const customer = estimate
    ? demoCustomers.find((c) => c.id === estimate.customer_id)
    : null;

  const [status, setStatus] = useState<EstimateStatus>(
    estimate?.status || "draft"
  );

  if (!estimate) {
    return (
      <div className="p-8">
        <Link
          href="/estimates"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to estimates
        </Link>
        <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-12 text-center">
          <p className="text-slate-400">Estimate not found.</p>
        </div>
      </div>
    );
  }

  const statusCfg = ESTIMATE_STATUS_CONFIG[status];

  const materialItems = estimate.line_items.filter(
    (li) => li.category === "material"
  );
  const laborItems = estimate.line_items.filter(
    (li) => li.category === "labor"
  );
  const equipmentItems = estimate.line_items.filter(
    (li) => li.category === "equipment"
  );

  const materialTotal = materialItems.reduce((s, li) => s + li.total, 0);
  const laborTotal = laborItems.reduce((s, li) => s + li.total, 0);
  const equipmentTotal = equipmentItems.reduce((s, li) => s + li.total, 0);

  return (
    <div className="p-8">
      <Link
        href="/estimates"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to estimates
      </Link>

      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Estimate #{estimate.id.replace("est-", "")}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {estimate.project_type} &mdash;{" "}
              {new Date(estimate.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EstimateStatus)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${statusCfg.color} ${statusCfg.bgColor} border-slate-700/50 bg-transparent focus:outline-none`}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
            <button className="flex items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
              <Printer className="h-4 w-4" />
              Generate PDF
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              <Send className="h-4 w-4" />
              Send to Customer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Professional Estimate Header */}
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    The Finishing Touch LLC
                  </h2>
                  <p className="text-sm text-slate-400">
                    Greentown, Indiana &bull; (765) 555-0100
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-300">
                    Estimate #{estimate.id.replace("est-", "")}
                  </p>
                  <p className="text-sm text-slate-400">
                    {new Date(estimate.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    Prepared For
                  </p>
                  <p className="text-sm font-medium text-slate-200">
                    {estimate.customer_name}
                  </p>
                  {customer && (
                    <>
                      {customer.address && (
                        <p className="text-sm text-slate-400">
                          {customer.address}
                        </p>
                      )}
                      {customer.city && (
                        <p className="text-sm text-slate-400">
                          {customer.city}, {customer.state} {customer.zip}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    Project
                  </p>
                  <p className="text-sm font-medium text-slate-200">
                    {estimate.project_type}
                  </p>
                  <p className="text-sm text-slate-400">
                    {estimate.dimensions.square_footage &&
                      `${estimate.dimensions.square_footage.toLocaleString()} sq ft`}
                    {estimate.dimensions.linear_feet &&
                      `${estimate.dimensions.linear_feet} linear ft`}
                    {estimate.complexity && ` • ${estimate.complexity} access`}
                  </p>
                  <p className="text-sm text-slate-400">
                    Timeline: {estimate.timeline}
                  </p>
                </div>
              </div>

              {/* Materials */}
              {materialItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
                    Materials
                  </h3>
                  <div className="rounded-lg border border-slate-700/30 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-slate-500 border-b border-slate-700/30">
                          <th className="px-4 py-2">Item</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2 text-right">Unit Cost</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/20">
                        {materialItems.map((li) => (
                          <tr key={li.id}>
                            <td className="px-4 py-2.5 text-sm text-slate-300">
                              {li.description}
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm text-slate-400">
                              {li.quantity} {li.unit}
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm text-slate-400">
                              {fmt.format(li.unit_cost)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-200">
                              {fmt.format(li.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-800/20">
                          <td
                            colSpan={3}
                            className="px-4 py-2 text-right text-xs font-medium text-slate-400"
                          >
                            Materials Subtotal
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-slate-200">
                            {fmt.format(materialTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Labor */}
              {laborItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">
                    Labor
                  </h3>
                  <div className="rounded-lg border border-slate-700/30 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-slate-500 border-b border-slate-700/30">
                          <th className="px-4 py-2">Task</th>
                          <th className="px-4 py-2 text-right">Hours</th>
                          <th className="px-4 py-2 text-right">Rate</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/20">
                        {laborItems.map((li) => (
                          <tr key={li.id}>
                            <td className="px-4 py-2.5 text-sm text-slate-300">
                              {li.description}
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm text-slate-400">
                              {li.quantity} hrs
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm text-slate-400">
                              {fmt.format(li.unit_cost)}/hr
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-200">
                              {fmt.format(li.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-800/20">
                          <td
                            colSpan={3}
                            className="px-4 py-2 text-right text-xs font-medium text-slate-400"
                          >
                            Labor Subtotal
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-slate-200">
                            {fmt.format(laborTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Equipment */}
              {equipmentItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
                    Equipment
                  </h3>
                  <div className="rounded-lg border border-slate-700/30 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-slate-500 border-b border-slate-700/30">
                          <th className="px-4 py-2">Item</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2 text-right">Unit Cost</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/20">
                        {equipmentItems.map((li) => (
                          <tr key={li.id}>
                            <td className="px-4 py-2.5 text-sm text-slate-300">
                              {li.description}
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm text-slate-400">
                              {li.quantity} {li.unit}
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm text-slate-400">
                              {fmt.format(li.unit_cost)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-200">
                              {fmt.format(li.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-800/20">
                          <td
                            colSpan={3}
                            className="px-4 py-2 text-right text-xs font-medium text-slate-400"
                          >
                            Equipment Subtotal
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-slate-200">
                            {fmt.format(equipmentTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className="border-t border-slate-700/50 pt-4">
                <div className="flex justify-end">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-slate-200">
                        {fmt.format(estimate.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Margin (25%)</span>
                      <span className="text-slate-200">
                        {fmt.format(estimate.margin)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700/50 pt-2 text-lg font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-emerald-400">
                        {fmt.format(estimate.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {estimate.notes && (
              <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
                <h3 className="text-sm font-semibold text-white mb-3">Notes</h3>
                <p className="text-sm text-slate-400">{estimate.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Status</h3>
              <div className="space-y-3">
                {(
                  ["draft", "sent", "accepted", "declined"] as const
                ).map((s) => {
                  const cfg = ESTIMATE_STATUS_CONFIG[s];
                  const isActive = status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? `${cfg.bgColor} ${cfg.color} border-current`
                          : "border-slate-700/50 text-slate-400 hover:bg-slate-800/30"
                      }`}
                    >
                      {s === "draft" && <FileText className="h-4 w-4" />}
                      {s === "sent" && <Send className="h-4 w-4" />}
                      {s === "accepted" && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {s === "declined" && <XCircle className="h-4 w-4" />}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Card */}
            {customer && (
              <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Customer
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm font-medium text-slate-200 hover:text-white"
                    >
                      {customer.name}
                    </Link>
                    {customer.phone && (
                      <p className="text-xs text-slate-400">{customer.phone}</p>
                    )}
                  </div>
                </div>
                {customer.email && (
                  <p className="text-sm text-slate-400">{customer.email}</p>
                )}
                {customer.address && (
                  <p className="text-sm text-slate-400 mt-1">
                    {customer.address}, {customer.city}
                  </p>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button className="flex w-full items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800">
                  <Pencil className="h-4 w-4" />
                  Edit Estimate
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg border border-slate-700/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800">
                  <Printer className="h-4 w-4" />
                  Generate PDF
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                  Send to Customer
                </button>
              </div>
            </div>

            {/* Project Summary */}
            <div className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Project Summary
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Type</dt>
                  <dd className="text-slate-200">{estimate.project_type}</dd>
                </div>
                {estimate.dimensions.square_footage && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Area</dt>
                    <dd className="text-slate-200">
                      {estimate.dimensions.square_footage.toLocaleString()} sq
                      ft
                    </dd>
                  </div>
                )}
                {estimate.dimensions.linear_feet && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Length</dt>
                    <dd className="text-slate-200">
                      {estimate.dimensions.linear_feet} linear ft
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-400">Complexity</dt>
                  <dd className="capitalize text-slate-200">
                    {estimate.complexity}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Materials</dt>
                  <dd className="text-slate-200 text-right">
                    {estimate.materials.join(", ")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Timeline</dt>
                  <dd className="text-slate-200">{estimate.timeline}</dd>
                </div>
                {estimate.options.demolition && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Demolition</dt>
                    <dd className="text-yellow-400">Yes</dd>
                  </div>
                )}
                {estimate.options.sealing && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Sealing</dt>
                    <dd className="text-emerald-400">Yes</dd>
                  </div>
                )}
                {estimate.options.color_stain && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Color/Stain</dt>
                    <dd className="text-slate-200 text-right">
                      {estimate.options.color_stain}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
