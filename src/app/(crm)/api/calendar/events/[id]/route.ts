import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;
  const body = await request.json();

  const { title, description, start_time, end_time, status, team_member_id,
    customer_name, customer_phone, customer_address, service_type, project_description } = body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (start_time !== undefined) updates.start_time = start_time;
  if (end_time !== undefined) updates.end_time = end_time;
  if (status !== undefined) updates.status = status;
  if (team_member_id !== undefined) updates.team_member_id = team_member_id;
  if (customer_name !== undefined) updates.customer_name = customer_name;
  if (customer_phone !== undefined) updates.customer_phone = customer_phone;
  if (customer_address !== undefined) updates.customer_address = customer_address;
  if (service_type !== undefined) updates.service_type = service_type;
  if (project_description !== undefined) updates.project_description = project_description;

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, id: data.id });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
