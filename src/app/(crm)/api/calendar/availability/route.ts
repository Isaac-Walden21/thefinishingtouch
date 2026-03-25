import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, rateLimit, rateLimitedResponse } from "@/lib/api-auth";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const isApiKey = validateApiKey(request);
  if (isApiKey) {
    const rl = rateLimit("availability", 60);
    if (!rl.allowed) return rateLimitedResponse();
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
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
    console.error("Availability error:", error);
    return NextResponse.json(
      { error: "Failed to compute availability" },
      { status: 500 }
    );
  }
}
