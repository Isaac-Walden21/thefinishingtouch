import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, rateLimit, rateLimitedResponse, extractVapiArgs, vapiResponse } from "@/lib/api-auth";
import { getAvailableSlots } from "@/lib/availability";

// GET /api/calendar/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const isApiKey = validateApiKey(request);
  if (isApiKey) {
    const rl = rateLimit("availability", 60);
    if (!rl.allowed) return rateLimitedResponse();
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? searchParams.get("date_range_start");
  const end = searchParams.get("end") ?? searchParams.get("date_range_end");
  const teamMemberId = searchParams.get("team_member_id") ?? undefined;

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end query params required" },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(start, end, teamMemberId);
    return NextResponse.json({ slots });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to compute availability";
    console.error("Availability GET error:", msg, error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/calendar/availability — Vapi tool call format
// Vapi sends function parameters as a POST body
export async function POST(request: NextRequest) {
  const isApiKey = validateApiKey(request);
  if (isApiKey) {
    const rl = rateLimit("availability", 60);
    if (!rl.allowed) return rateLimitedResponse();
  }

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const args = extractVapiArgs(raw);

  const start = (args.date_range_start ?? args.start) as string | undefined;
  const end = (args.date_range_end ?? args.end) as string | undefined;
  const teamMemberId = args.team_member_id as string | undefined;

  if (!start || !end) {
    return NextResponse.json(
      { error: "date_range_start and date_range_end are required", received: args },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(start, end, teamMemberId);
    return NextResponse.json(vapiResponse({ slots }, args));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to compute availability";
    console.error("Availability POST error:", msg, error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
