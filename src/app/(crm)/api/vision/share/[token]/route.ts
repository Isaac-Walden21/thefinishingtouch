import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// GET /api/vision/share/[token] — public share page data
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSessionUser();

  const { token } = await params;

  const { data: share } = await supabaseAdmin
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

  const { data: project } = await supabaseAdmin
    .from("vision_projects").select("*").eq("company_id", session.companyId)
    .eq("id", share.project_id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: iterations } = await supabaseAdmin
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

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
