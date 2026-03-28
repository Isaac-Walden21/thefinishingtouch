import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/vision/portfolio — get starred vision projects
export async function GET() {
  const { data, error } = await supabase
    .from("vision_projects")
    .select("*")
    .eq("starred", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch iterations for each project
  const projectIds = (data ?? []).map((p) => p.id);
  const { data: iterations } = await supabase
    .from("vision_iterations")
    .select("*")
    .in("project_id", projectIds.length > 0 ? projectIds : ["_none_"])
    .order("created_at");

  const iterationsByProject = new Map<string, typeof iterations>();
  for (const iter of iterations ?? []) {
    const existing = iterationsByProject.get(iter.project_id) ?? [];
    existing.push(iter);
    iterationsByProject.set(iter.project_id, existing);
  }

  const portfolio = (data ?? []).map((p) => ({
    ...p,
    iterations: iterationsByProject.get(p.id) ?? [],
  }));

  return NextResponse.json(portfolio);
}
