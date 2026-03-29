import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PATCH /api/job-walks/[id]/photos/[photoId] — update photo metadata
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  const body = await request.json();

  const allowed = ["caption", "category", "annotations", "sort_order"];
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

  // Validate category if provided
  if (updates.category) {
    const validCategories = [
      "overview",
      "existing_condition",
      "obstacle",
      "measurement_reference",
      "customer_request",
    ];
    if (!validCategories.includes(updates.category as string)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("job_walk_photos")
    .update(updates)
    .eq("id", photoId)
    .eq("job_walk_id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Photo not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/job-walks/[id]/photos/[photoId] — delete photo
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;

  // Get photo URL before deleting record
  const { data: photo } = await supabase
    .from("job_walk_photos")
    .select("photo_url")
    .eq("id", photoId)
    .eq("job_walk_id", id)
    .single();

  if (!photo) {
    return NextResponse.json(
      { error: "Photo not found" },
      { status: 404 }
    );
  }

  // Remove from storage
  const storagePath = extractStoragePath(photo.photo_url);
  if (storagePath) {
    await supabase.storage.from("job-walk-photos").remove([storagePath]);
  }

  // Delete database record
  const { error } = await supabase
    .from("job_walk_photos")
    .delete()
    .eq("id", photoId)
    .eq("job_walk_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: photoId });
}

/** Extract the storage path from a full public URL */
function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(
      /\/storage\/v1\/object\/public\/job-walk-photos\/(.+)$/
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
