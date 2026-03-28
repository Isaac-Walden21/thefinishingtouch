import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/vision/share/[token] — public share page data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data: share } = await supabase
    .from("vision_shares")
    .select("*")
    .eq("token", token)
    .single();

  if (!share) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }

  if (new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "This share link has expired" }, { status: 410 });
  }

  const { data: project } = await supabase
    .from("vision_projects")
    .select("*")
    .eq("id", share.project_id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: iterations } = await supabase
    .from("vision_iterations")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at");

  return NextResponse.json({
    project: {
      service_type: project.service_type,
      description: project.description,
      original_image_url: project.original_image_url,
      customer_name: project.customer_name,
      created_at: project.created_at,
    },
    iterations: iterations ?? [],
  });
}
