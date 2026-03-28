import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/vision/[id]/annotations — save annotations on an iteration
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { data: iteration } = await supabase
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

  const { data, error } = await supabase
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
}
