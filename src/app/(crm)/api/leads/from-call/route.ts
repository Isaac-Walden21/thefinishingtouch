import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateApiKey, rateLimit, unauthorizedResponse, rateLimitedResponse, extractVapiArgs } from "@/lib/api-auth";
import { findOrCreateCustomer } from "@/lib/customer-upsert";

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const rl = rateLimit("leads-from-call", 30);
  if (!rl.allowed) return rateLimitedResponse();

  const raw = await request.json();
  const args = extractVapiArgs(raw);
  // Handle Vapi typo fallback: "cusotmer_phone" → "customer_phone"
  const customer_name = args.customer_name as string | undefined;
  const customer_phone = (args.customer_phone ?? args.cusotmer_phone) as string | undefined;
  const message = args.message as string | undefined;
  const service_type = args.service_type as string | undefined;
  const vapi_call_id = args.vapi_call_id as string | undefined;

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
