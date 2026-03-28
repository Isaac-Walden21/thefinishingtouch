import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";

// PATCH /api/calendar/events/[id]/reschedule — drag-and-drop reschedule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { data: event } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .update({ start_time, end_time })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    lead_id: event.lead_id,
    type: "note",
    description: `Event "${event.title}" rescheduled from ${event.start_time} to ${start_time}`,
  });

  return NextResponse.json(data);
}
