import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";

// GET /api/job-walks — list all job walks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  let query = supabase
    .from("job_walks")
    .select("*, customer:customers(id, name, email, phone, address)")
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
}

// POST /api/job-walks — create a new job walk
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customer_id, lead_id, calendar_event_id, gps_lat, gps_lng, created_by } = body;

  if (!customer_id) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  // Verify customer exists
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name")
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

  const { data, error } = await supabase
    .from("job_walks")
    .insert({
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
    customer_id,
    lead_id: lead_id ?? null,
    type: "note",
    description: `Job walk started for ${customer.name}`,
    created_by: created_by ?? null,
  });

  return NextResponse.json(data, { status: 201 });
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
