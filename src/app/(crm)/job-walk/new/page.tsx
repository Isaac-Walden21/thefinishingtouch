"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, User } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "@/components/PageHeader";
import Button from "@/components/ui/Button";
import { demoCustomers } from "@/lib/demo-data";

export default function NewJobWalkPage() {
  const router = useRouter();
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredCustomers = demoCustomers.filter(
    (c) =>
      !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.address ?? "").toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = demoCustomers.find((c) => c.id === selectedCustomerId);

  function handleCreate() {
    if (!selectedCustomerId) return;
    // In production, this would create the record via API and get back the real ID
    const newId = `jw-${Date.now()}`;
    router.push(`/job-walk/${newId}?customer=${selectedCustomerId}&mode=edit`);
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader
        title="New Job Walk"
        subtitle="Select a customer to start the on-site capture"
        backHref="/job-walk"
        backLabel="Job Walks"
      />

      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Customer selector */}
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Customer
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={selectedCustomer ? selectedCustomer.name : customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomerId(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {showDropdown && !selectedCustomerId && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredCustomers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    No customers found
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setCustomerSearch("");
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light">
                        <User className="h-4 w-4 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {c.name}
                        </p>
                        {c.address && (
                          <p className="truncate text-xs text-slate-500">
                            {c.address}, {c.city}, {c.state}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected customer preview */}
          {selectedCustomer && (
            <div className="mt-4 rounded-lg border border-brand/20 bg-brand-light/50 p-4">
              <p className="text-sm font-medium text-foreground">
                {selectedCustomer.name}
              </p>
              {selectedCustomer.address && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedCustomer.address}, {selectedCustomer.city},{" "}
                  {selectedCustomer.state} {selectedCustomer.zip}
                </p>
              )}
              {selectedCustomer.phone && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedCustomer.phone}
                </p>
              )}
              {selectedCustomer.service_type && (
                <p className="mt-1 text-xs text-brand">
                  {selectedCustomer.service_type}
                </p>
              )}
            </div>
          )}

          {/* Create button */}
          <div className="mt-6">
            <Button
              onClick={handleCreate}
              disabled={!selectedCustomerId}
              className="w-full py-3 text-base"
            >
              <Plus className="h-5 w-5" />
              Start Job Walk
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
