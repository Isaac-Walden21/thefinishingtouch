import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

// POST /api/job-walks/[id]/sketch — upload sketch image
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();

  const { id } = await params;

  // Verify job walk exists
  const { data: walk } = await supabaseAdmin
    .from("job_walks").select("id, sketch_url").eq("company_id", session.companyId)
    .eq("id", id)
    .single();

  if (!walk) {
    return NextResponse.json(
      { error: "Job walk not found" },
      { status: 404 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("sketch") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "sketch file is required" },
      { status: 400 }
    );
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large. Maximum 10MB." },
      { status: 400 }
    );
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PNG, JPEG, WebP, SVG" },
      { status: 400 }
    );
  }

  // Remove old sketch if exists
  if (walk.sketch_url) {
    const oldPath = extractStoragePath(walk.sketch_url);
    if (oldPath) {
      await supabaseAdmin.storage.from("job-walk-photos").remove([oldPath]);
    }
  }

  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${id}/sketch-${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { data: uploaded, error: uploadError } = await supabaseAdmin.storage
    .from("job-walk-photos")
    .upload(fileName, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from("job-walk-photos")
    .getPublicUrl(uploaded.path);

  // Update job walk record
  const { data, error } = await supabaseAdmin
    .from("job_walks")
    .update({ sketch_url: urlData.publicUrl })
    .eq("id", id)
    .select("id, sketch_url")
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
