import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, rateLimit, unauthorizedResponse, rateLimitedResponse } from "@/lib/api-auth";
import { findOrCreateCustomer } from "@/lib/customer-upsert";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const rl = rateLimit("leads-from-call", 30);
  if (!rl.allowed) return rateLimitedResponse();

  const body = await request.json();
  const { customer_name, customer_phone, message, service_type, vapi_call_id } = body;

  if (!customer_name || !customer_phone) {
    return NextResponse.json(
      { error: "customer_name and customer_phone are required" },
      { status: 400 }
    );
  }

  try {
    const customerId = await findOrCreateCustomer({
      name: customer_name,
      phone: customer_phone,
      service_type,
    });

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        customer_id: customerId,
        status: "new",
        project_type: service_type ?? null,
        project_description: message ?? null,
        vapi_call_id: vapi_call_id ?? null,
      })
      .select("*")
      .single();

    if (error) throw new Error(`Lead creation failed: ${error.message}`);

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Lead from call error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lead" },
      { status: 500 }
    );
  }
}
