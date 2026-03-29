import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

// GET /api/job-walks/[id] — get single job walk with photos
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("job_walks")
    .select("*, customer:customers(id, name, email, phone, address, city, state, zip)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Job walk not found" },
      { status: 404 }
    );
  }

  // Fetch photos separately ordered by sort_order
  const { data: photos } = await supabase
    .from("job_walk_photos")
    .select("*")
    .eq("job_walk_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ...data, photos: photos ?? [] });
}

// PATCH /api/job-walks/[id] — update job walk
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const allowed = [
    "measurements",
    "site_conditions",
    "customer_preferences",
    "status",
    "sketch_url",
    "voice_note_url",
    "voice_transcript",
    "gps_lat",
    "gps_lng",
    "weather",
    "lead_id",
    "calendar_event_id",
    "created_by",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // Fetch current for audit trail
  const { data: current } = await supabase
    .from("job_walks")
    .select("*")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json(
      { error: "Job walk not found" },
      { status: 404 }
    );
  }

  // Auto-set completed_at when status changes to "completed"
  if (updates.status === "completed" && current.status !== "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("job_walks")
    .update(updates)
    .eq("id", id)
    .select("*, customer:customers(id, name, email, phone, address)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: "job_walk_updated",
    category: "job_walks",
    entity_type: "job_walk",
    entity_id: id,
    old_value: current as Record<string, unknown>,
    new_value: updates,
  });

  return NextResponse.json(data);
}

// DELETE /api/job-walks/[id] — delete draft job walk only
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check status before deleting
  const { data: current } = await supabase
    .from("job_walks")
    .select("id, status")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json(
      { error: "Job walk not found" },
      { status: 404 }
    );
  }

  if (current.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft job walks can be deleted" },
      { status: 400 }
    );
  }

  // Photos cascade-delete via FK, but we need to clean up storage files
  const { data: photos } = await supabase
    .from("job_walk_photos")
    .select("photo_url")
    .eq("job_walk_id", id);

  // Clean up storage files
  if (photos && photos.length > 0) {
    const paths = photos
      .map((p) => extractStoragePath(p.photo_url))
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from("job-walk-photos").remove(paths);
    }
  }

  // Also clean up sketch and voice note if present
  const { data: walk } = await supabase
    .from("job_walks")
    .select("sketch_url, voice_note_url")
    .eq("id", id)
    .single();

  if (walk) {
    const cleanupPaths: string[] = [];
    if (walk.sketch_url) {
      const p = extractStoragePath(walk.sketch_url);
      if (p) cleanupPaths.push(p);
    }
    if (walk.voice_note_url) {
      const p = extractStoragePath(walk.voice_note_url);
      if (p) cleanupPaths.push(p);
    }
    if (cleanupPaths.length > 0) {
      await supabase.storage.from("job-walk-photos").remove(cleanupPaths);
    }
  }

  const { error } = await supabase
    .from("job_walks")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}

/** Extract the storage path from a full public URL */
function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/job-walk-photos\/(.+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
