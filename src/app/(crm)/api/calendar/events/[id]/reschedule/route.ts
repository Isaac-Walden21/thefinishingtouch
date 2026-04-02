import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// PATCH /api/calendar/events/[id]/reschedule — drag-and-drop reschedule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;
  const body = await request.json();
  const { start_time, end_time } = body as {
    start_time: string;
    end_time: string;
  };

  if (!start_time || !end_time) {
    return NextResponse.json(
      { error: "start_time and end_time are required" },
      { status: 400 }
    );
  }

  const { data: event } = await supabaseAdmin
    .from("calendar_events").select("*").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .update({ start_time, end_time })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      company_id: session.companyId,
    lead_id: event.lead_id,
    type: "note",
    description: `Event "${event.title}" rescheduled from ${event.start_time} to ${start_time}`,
  });

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
