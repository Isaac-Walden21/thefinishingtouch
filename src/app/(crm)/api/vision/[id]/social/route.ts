import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// POST /api/vision/[id]/social — generate social media template data
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  const { data: project } = await supabaseAdmin
    .from("vision_projects").select("*").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Vision project not found" }, { status: 404 });
  }

  const { data: iterations } = await supabaseAdmin
    .from("vision_iterations")
    .select("*")
    .eq("project_id", id)
    .order("created_at");

  const beforeImage = project.original_image_url;
  const afterImage = iterations?.length
    ? iterations[iterations.length - 1].image_url
    : null;

  // Generate social media caption suggestions
  const captions = {
    instagram: `Before & After: ${project.service_type} transformation! ✨\n\nAnother project brought to life by The Finishing Touch LLC. From vision to reality — swipe to see the difference.\n\n#TheFini shingTouch #${project.service_type.replace(/\s+/g, "")} #BeforeAndAfter #ConcreteWork #GreentowinIN #HomeImprovement`,
    facebook: `Check out this ${project.service_type} project we just visualized for a customer! The Finishing Touch LLC turns your outdoor space dreams into reality. Contact us for a free estimate!\n\n🔗 thefinishingtouchllc.com`,
    google_business: `New ${project.service_type} project visualization. The Finishing Touch LLC — Concrete, Post Frames, Landscaping serving Greentown, IN and surrounding areas. Call today for your free estimate!`,
  };

  return NextResponse.json({
    before_image: beforeImage,
    after_image: afterImage,
    service_type: project.service_type,
    captions,
    hashtags: [
      "TheFinishingTouch",
      project.service_type.replace(/\s+/g, ""),
      "BeforeAndAfter",
      "GreentownIN",
      "ConcreteContractor",
      "HomeImprovement",
    ],
  });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
