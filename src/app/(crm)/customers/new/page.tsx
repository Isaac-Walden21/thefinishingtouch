"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { supabase } from "@/lib/supabase";

const serviceTypes = [
  "Concrete Patio",
  "Driveway",
  "Post Frame",
  "Landscaping",
  "Curbing",
  "Sidewalk",
  "Stamped Concrete",
  "Firewood",
  "Other",
];

const sources = [
  "Google",
  "Facebook",
  "Website",
  "Referral",
  "Yard Sign",
  "Phone Call",
  "Other",
];

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const customerData = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zip: (formData.get("zip") as string) || null,
      service_type: (formData.get("service_type") as string) || null,
      source: (formData.get("source") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert(customerData)
      .select()
      .single();

    if (customerError) {
      setError(customerError.message);
      setSaving(false);
      return;
    }

    // Create lead if project info provided
    const projectType = formData.get("project_type") as string;
    if (projectType && customer) {
      const quotedAmount = formData.get("quoted_amount") as string;
      await supabase.from("leads").insert({
        customer_id: customer.id,
        status: "new",
        project_type: projectType,
        project_description: (formData.get("project_description") as string) || null,
        quoted_amount: quotedAmount ? parseFloat(quotedAmount) : null,
      });
    }

    router.push("/customers");
  }

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <Link
        href="/customers"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Add New Customer</h1>
        <p className="text-sm text-slate-500 mb-8">
          Create a new customer profile and optionally add a lead.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Info */}
          <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Customer Information</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input name="name" label="Full Name *" required placeholder="e.g. Steve & Linda Morales" />
              </div>
              <Input name="email" label="Email" type="email" placeholder="email@example.com" />
              <Input name="phone" label="Phone" type="tel" placeholder="(765) 555-0000" />
              <div className="sm:col-span-2">
                <Input name="address" label="Street Address" placeholder="1234 Main St" />
              </div>
              <Input name="city" label="City" placeholder="Greentown" />
              <div className="grid grid-cols-2 gap-4">
                <Input name="state" label="State" defaultValue="IN" />
                <Input name="zip" label="ZIP" placeholder="46936" />
              </div>
              <Select name="service_type" label="Service Type">
                <option value="">Select a service...</option>
                {serviceTypes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Select name="source" label="Lead Source">
                <option value="">Select a source...</option>
                {sources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <div className="sm:col-span-2">
                <Textarea name="notes" label="Notes" rows={3} placeholder="Any notes about this customer..." />
              </div>
            </div>
          </div>

          {/* Lead Info */}
          <div className="rounded-xl border border-slate-200 bg-surface shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Lead Details (Optional)</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input name="project_type" label="Project Type" placeholder="e.g. Stamped Concrete Patio" />
              <Input name="quoted_amount" label="Quoted Amount" type="number" placeholder="0.00" step="0.01" min="0" />
              <div className="sm:col-span-2">
                <Textarea name="project_description" label="Project Description" rows={3} placeholder="Describe the project scope, dimensions, materials, etc." />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Customer"}
            </Button>
            <Button variant="secondary" href="/customers">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
