import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// POST /api/vision/[id]/annotations — save annotations on an iteration
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;
  const body = await request.json();
  const { iteration_id, annotations } = body as {
    iteration_id: string;
    annotations: Record<string, unknown>[];
  };

  if (!iteration_id || !annotations) {
    return NextResponse.json(
      { error: "iteration_id and annotations are required" },
      { status: 400 }
    );
  }

  // Verify the iteration belongs to this project
  const { data: iteration } = await supabaseAdmin
    .from("vision_iterations")
    .select("id, project_id")
    .eq("id", iteration_id)
    .eq("project_id", id)
    .single();

  if (!iteration) {
    return NextResponse.json(
      { error: "Iteration not found for this project" },
      { status: 404 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("vision_annotations")
    .upsert(
      {
        iteration_id,
        annotations,
      },
      { onConflict: "iteration_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
