import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { getSessionUser } from "@/lib/session";

// GET /api/job-walks — list all job walks
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  let query = supabaseAdmin
    .from("job_walks").select("*, customer:customers(id, name, email, phone, address)").eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/job-walks — create a new job walk
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();

  const body = await request.json();
  const { customer_id, lead_id, calendar_event_id, gps_lat, gps_lng, created_by } = body;

  if (!customer_id) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  // Verify customer exists
  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers").select("id, name").eq("company_id", session.companyId)
    .eq("id", customer_id)
    .single();

  if (customerError || !customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  // Attempt to fetch weather if GPS coordinates provided
  let weather = null;
  if (gps_lat && gps_lng) {
    weather = await fetchWeather(gps_lat, gps_lng);
  }

  const { data, error } = await supabaseAdmin
    .from("job_walks").insert({
      company_id: session.companyId,
      customer_id,
      lead_id: lead_id ?? null,
      calendar_event_id: calendar_event_id ?? null,
      gps_lat: gps_lat ?? null,
      gps_lng: gps_lng ?? null,
      weather,
      created_by: created_by ?? null,
    })
    .select("*, customer:customers(id, name, email, phone, address)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      company_id: session.companyId,
    customer_id,
    lead_id: lead_id ?? null,
    type: "note",
    description: `Job walk started for ${customer.name}`,
    created_by: created_by ?? null,
  });

  return NextResponse.json(data, { status: 201 });

  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Fetch weather from OpenWeatherMap. Returns null on failure. */
async function fetchWeather(
  lat: number,
  lng: number
): Promise<{ temp: number; conditions: string; recent_rain: boolean } | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const conditions = json.weather?.[0]?.main ?? "Unknown";
    const temp = Math.round(json.main?.temp ?? 0);
    const recentRain =
      conditions.toLowerCase().includes("rain") ||
      (json.rain && Object.keys(json.rain).length > 0);

    return { temp, conditions, recent_rain: !!recentRain };
  } catch {
    return null;
  }
}
