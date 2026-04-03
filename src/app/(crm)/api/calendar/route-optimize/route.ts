import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// GET /api/calendar/route-optimize — get optimal route for a day's visits
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const teamMemberId = searchParams.get("team_member_id");

  if (!date) {
    return NextResponse.json(
      { error: "date query parameter is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;

  let query = supabaseAdmin
    .from("calendar_events").select("*").eq("company_id", session.companyId)
    .eq("type", "quote_visit")
    .eq("status", "scheduled")
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay)
    .order("start_time");

  if (teamMemberId) {
    query = query.eq("team_member_id", teamMemberId);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!events?.length) {
    return NextResponse.json({ stops: [], message: "No visits scheduled for this date" });
  }

  // Build ordered stops with addresses
  const stops = events
    .filter((e) => e.customer_address)
    .map((e) => ({
      event_id: e.id,
      customer_name: e.customer_name,
      address: e.customer_address,
      start_time: e.start_time,
      end_time: e.end_time,
      service_type: e.service_type,
    }));

  // Build a Google Maps directions URL for all stops
  const baseAddress = "Greentown, IN"; // Office location
  const waypoints = stops.map((s) => encodeURIComponent(s.address!));
  const mapsUrl =
    stops.length > 0
      ? `https://www.google.com/maps/dir/${encodeURIComponent(baseAddress)}/${waypoints.join("/")}/${encodeURIComponent(baseAddress)}`
      : null;

  return NextResponse.json({
    stops,
    total_stops: stops.length,
    maps_url: mapsUrl,
    note: "Stops are ordered by scheduled time. Use the maps_url for turn-by-turn navigation.",
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
