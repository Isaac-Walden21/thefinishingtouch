import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/vision/[id]/share — generate a public share link
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: project } = await supabase
    .from("vision_projects")
    .select("id")
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Vision project not found" }, { status: 404 });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { error } = await supabase.from("vision_shares").insert({
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
}
