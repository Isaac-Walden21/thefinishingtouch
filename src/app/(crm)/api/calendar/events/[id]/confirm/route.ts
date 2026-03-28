import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendConfirmation } from "@/lib/twilio";
import { logActivity } from "@/lib/audit";

// POST /api/calendar/events/[id]/confirm — send SMS confirmation
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: event } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!event.customer_phone) {
    return NextResponse.json(
      { error: "No customer phone number on this event" },
      { status: 400 }
    );
  }

  if (!event.customer_name) {
    return NextResponse.json(
      { error: "No customer name on this event" },
      { status: 400 }
    );
  }

  try {
    const result = await sendConfirmation({
      customer_name: event.customer_name,
      customer_phone: event.customer_phone,
      start_time: event.start_time,
      service_type: event.service_type,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send SMS" },
        { status: 500 }
      );
    }

    await logActivity({
      lead_id: event.lead_id,
      type: "note",
      description: `SMS confirmation sent to ${event.customer_name} at ${event.customer_phone}`,
    });

    return NextResponse.json({
      success: true,
      message: `Confirmation sent to ${event.customer_phone}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Twilio not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER",
      },
      { status: 500 }
    );
  }
}
