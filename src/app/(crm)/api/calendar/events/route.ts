import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateApiKey, rateLimit, rateLimitedResponse, extractVapiArgs, vapiResponse } from "@/lib/api-auth";
import { findOrCreateCustomer } from "@/lib/customer-upsert";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const teamMemberId = searchParams.get("team_member_id");

  let query = supabaseAdmin
    .from("calendar_events").select("*, team_member:team_members(id, name, color)").eq("company_id", session.companyId)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  if (start) query = query.gte("start_time", start);
  if (end) query = query.lte("end_time", end);
  if (teamMemberId) query = query.eq("team_member_id", teamMemberId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();

  const isApiKey = validateApiKey(request);
  if (isApiKey) {
    const rl = rateLimit("events-create", 30);
    if (!rl.allowed) return rateLimitedResponse();
  }

  const raw = await request.json();
  const vapiArgs = extractVapiArgs(raw);
  const body = vapiArgs;
  const {
    team_member_id,
    type = "quote_visit",
    title,
    start,
    end,
    datetime,
    customer_name,
    customer_phone,
    customer_address,
    service_type,
    project_description,
    created_by = "manual",
    vapi_call_id,
  } = body as Record<string, string | undefined>;

  const eventStart = start ?? datetime;
  const eventEnd = end ?? (datetime ? new Date(new Date(datetime).getTime() + 3600000).toISOString() : undefined);

  if (!eventStart || !eventEnd) {
    return NextResponse.json(
      { error: "start/end or datetime is required" },
      { status: 400 }
    );
  }

  let assignedTeamMemberId = team_member_id;
  if (!assignedTeamMemberId) {
    const { data: slot } = await supabaseAdmin
      .from("availability_rules").select("team_member_id").eq("company_id", session.companyId)
      .eq("is_enabled", true)
      .limit(1)
      .single();
    assignedTeamMemberId = slot?.team_member_id;
  }

  if (!assignedTeamMemberId) {
    return NextResponse.json(
      { error: "No available team member found" },
      { status: 400 }
    );
  }

  try {
    let leadId: string | null = null;

    if (type === "quote_visit" && customer_name && customer_phone) {
      const customerId = await findOrCreateCustomer({
        name: customer_name,
        phone: customer_phone,
        address: customer_address,
        service_type,
      });

      const { data: lead, error: leadError } = await supabaseAdmin
        .from("leads").insert({
      company_id: session.companyId,
          customer_id: customerId,
          status: "booked",
          project_type: service_type,
          project_description,
          assigned_to: assignedTeamMemberId,
          vapi_call_id: vapi_call_id ?? null,
        })
        .select("id")
        .single();

      if (leadError) throw new Error(`Lead creation failed: ${leadError.message}`);
      leadId = lead.id;
    }

    const eventTitle = title ?? (customer_name ? `Quote: ${customer_name}` : "Blocked Time");
    const { data: event, error: eventError } = await supabaseAdmin
      .from("calendar_events").insert({
      company_id: session.companyId,
        team_member_id: assignedTeamMemberId,
        type,
        title: eventTitle,
        start_time: eventStart,
        end_time: eventEnd,
        customer_name: customer_name ?? null,
        customer_phone: customer_phone ?? null,
        customer_address: customer_address ?? null,
        service_type: service_type ?? null,
        project_description: project_description ?? null,
        created_by,
        lead_id: leadId,
      })
      .select("*")
      .single();

    if (eventError) throw new Error(`Event creation failed: ${eventError.message}`);

    return NextResponse.json(vapiResponse(event, vapiArgs), { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create event" },
      { status: 500 }
    );
  }

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
