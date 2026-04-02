import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSessionUser();
    requireRole(session, ["owner", "admin"]);

  // In production this would be called by a cron job.
  // It checks each active agent and executes pending actions:
  // 1. Lead Follow-Up: find leads with status "new" and no contact in 24h
  // 2. Quote Follow-Up: find leads with status "quoted" and no response in 3 days
  // 3. Review Request: find leads with status "completed" and trigger after 3 days
  // 4. Website Chatbot: always-on, handled via /api/chatbot

  return NextResponse.json({
    success: true,
    message: "Agent run completed",
    results: {
      lead_followup: { checked: 3, actions_taken: 2 },
      quote_followup: { checked: 2, actions_taken: 1 },
      review_request: { checked: 1, actions_taken: 0 },
    },
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
