import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// POST /api/vision/[id]/share — generate a public share link
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  const { data: project } = await supabaseAdmin
    .from("vision_projects").select("id").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Vision project not found" }, { status: 404 });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { error } = await supabaseAdmin.from("vision_shares").insert({
    project_id: id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    token,
    url: `${appUrl}/api/vision/share/${token}`,
    expires_at: expiresAt.toISOString(),
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
