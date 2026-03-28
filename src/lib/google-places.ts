/**
 * Google Places API helpers — address autocomplete validation and parsing
 * Client-side autocomplete is handled by the Google Maps JS SDK;
 * this module provides server-side validation and parsing utilities.
 */

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api";

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY not configured");
  }
  return key;
}

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  full: string;
  lat: number | null;
  lng: number | null;
}

/** Validate and geocode an address using Google Places */
export async function validateAddress(
  address: string
): Promise<{ valid: boolean; parsed: ParsedAddress | null; error?: string }> {
  const apiKey = getApiKey();

  try {
    const res = await fetch(
      `${PLACES_API_BASE}/geocode/json?${new URLSearchParams({
        address,
        key: apiKey,
        components: "country:US",
      })}`
    );

    if (!res.ok) {
      return { valid: false, parsed: null, error: `Geocode API error: ${res.status}` };
    }

    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return { valid: false, parsed: null, error: "Address not found" };
    }

    const result = data.results[0];
    const parsed = parseGoogleAddressComponents(result.address_components);

    return {
      valid: true,
      parsed: {
        ...parsed,
        full: result.formatted_address,
        lat: result.geometry?.location?.lat ?? null,
        lng: result.geometry?.location?.lng ?? null,
      },
    };
  } catch (error) {
    return {
      valid: false,
      parsed: null,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/** Parse Google address components into a structured format */
function parseGoogleAddressComponents(
  components: Array<{ long_name: string; short_name: string; types: string[] }>
): Omit<ParsedAddress, "full" | "lat" | "lng"> {
  let streetNumber = "";
  let route = "";
  let city = "";
  let state = "";
  let zip = "";

  for (const component of components) {
    const types = component.types;

    if (types.includes("street_number")) {
      streetNumber = component.long_name;
    } else if (types.includes("route")) {
      route = component.long_name;
    } else if (types.includes("locality")) {
      city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      state = component.short_name;
    } else if (types.includes("postal_code")) {
      zip = component.long_name;
    }
  }

  return {
    street: [streetNumber, route].filter(Boolean).join(" "),
    city,
    state,
    zip,
  };
}

/** Parse a raw address string into components (best-effort, no API call) */
export function parseAddressLocal(raw: string): Partial<ParsedAddress> {
  // Match pattern: Street, City, ST ZIP
  const match = raw.match(
    /^(.+?),\s*(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  );

  if (match) {
    return {
      street: match[1].trim(),
      city: match[2].trim(),
      state: match[3],
      zip: match[4],
      full: raw,
    };
  }

  // Try simpler pattern: Street, City ST ZIP
  const match2 = raw.match(
    /^(.+?),\s*(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  );

  if (match2) {
    return {
      street: match2[1].trim(),
      city: match2[2].trim(),
      state: match2[3],
      zip: match2[4],
      full: raw,
    };
  }

  return { full: raw };
}
