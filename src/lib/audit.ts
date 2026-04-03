import { supabaseAdmin } from "./supabase";

/** Log an action to the audit_log table */
export async function logAudit(params: {
  user_id?: string | null;
  company_id?: string;
  action: string;
  category: string;
  entity_type?: string;
  entity_id?: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_log").insert({
    user_id: params.user_id ?? null,
    company_id: params.company_id ?? null,
    action: params.action,
    category: params.category,
    entity_type: params.entity_type ?? null,
    entity_id: params.entity_id ?? null,
    old_value: params.old_value ?? null,
    new_value: params.new_value ?? null,
  });

  if (error) {
    console.error("Audit log error:", error.message);
  }
}

/** Log an activity to the activities table */
export async function logActivity(params: {
  lead_id?: string | null;
  customer_id?: string | null;
  company_id?: string;
  type: "call" | "email" | "quote" | "payment" | "note" | "ai_action";
  description: string;
  created_by?: string | null;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("activities").insert({
    lead_id: params.lead_id ?? null,
    customer_id: params.customer_id ?? null,
    company_id: params.company_id ?? null,
    type: params.type,
    description: params.description,
    created_by: params.created_by ?? null,
  });

  if (error) {
    console.error("Activity log error:", error.message);
  }
}
