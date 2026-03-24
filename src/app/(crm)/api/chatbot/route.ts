import { NextResponse } from "next/server";

const TFT_SYSTEM_PROMPT = `You are a friendly assistant for The Finishing Touch LLC, a concrete, landscaping, and post frame construction company based in Howard County, Indiana.

Services offered:
- Concrete patios (stamped, broom finish, exposed aggregate)
- Concrete driveways (new pours and tear-out/replace)
- Decorative curbing (slant, mower edge, stamped)
- Post frame buildings (garages, barns, workshops)
- Landscaping (retaining walls, mulch beds, plantings, sod)
- Firewood delivery (seasoned hardwood)

Service area: Howard County and surrounding areas including Kokomo, Greentown, Russiaville, Noblesville, and Westfield, Indiana.

Pricing ranges (approximate):
- Concrete patio: $8-20/sq ft depending on finish
- Driveway: $8-15/sq ft
- Curbing: $8-15/linear ft
- Post frame: varies widely by size, starting around $20,000
- Landscaping: varies by scope

Scheduling: Spring and summer are busiest. Book early for best availability.

If the visitor wants a quote or to schedule, collect their name, phone, email, and project description.`;

export async function POST(request: Request) {
  const body = await request.json();
  const { message, conversation_history } = body;

  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  // In production: call OpenAI with TFT_SYSTEM_PROMPT and conversation history.
  // If lead info is collected, create a lead in the CRM via Supabase.

  return NextResponse.json({
    reply:
      "Thanks for reaching out! I'd be happy to help. The Finishing Touch specializes in concrete, landscaping, and post frame construction in Howard County, IN. What type of project are you interested in?",
    lead_captured: false,
  });
}
