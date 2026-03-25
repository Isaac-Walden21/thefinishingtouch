import { supabase } from "./supabase";

interface CustomerInput {
  name: string;
  phone: string;
  address?: string;
  service_type?: string;
}

/**
 * Find existing customer by phone number, or create a new one.
 * Returns the customer ID.
 */
export async function findOrCreateCustomer(
  input: CustomerInput
): Promise<string> {
  if (input.phone) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", input.phone)
      .limit(1)
      .single();

    if (existing) return existing.id;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name,
      phone: input.phone,
      address: input.address ?? null,
      service_type: input.service_type ?? null,
      source: "phone_agent",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create customer: ${error.message}`);
  return data.id;
}
