/**
 * Google Calendar API client — OAuth2-based two-way sync
 */

const GCAL_BASE = "https://www.googleapis.com/calendar/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function getConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Calendar environment variables not configured");
  }

  return { clientId, clientSecret, refreshToken, calendarId };
}

/** Exchange refresh token for a fresh access token */
async function getAccessToken(): Promise<string> {
  const config = getConfig();

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function gcalApi(
  path: string,
  options: { method?: string; body?: Record<string, unknown>; accessToken: string }
) {
  const config = getConfig();
  const url = `${GCAL_BASE}/calendars/${encodeURIComponent(config.calendarId)}${path}`;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${err}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/** Generate the Google OAuth2 authorization URL */
export function connectCalendar(): string {
  const config = getConfig();
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/settings/integrations/google-calendar/callback`;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Map CRM event to Google Calendar event format */
function mapToGoogleEvent(event: {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  customer_name?: string | null;
  customer_address?: string | null;
}) {
  return {
    summary: event.title,
    description: [
      event.description,
      event.customer_name ? `Customer: ${event.customer_name}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    location: event.customer_address ?? undefined,
    start: {
      dateTime: event.start_time,
      timeZone: "America/Indiana/Indianapolis",
    },
    end: {
      dateTime: event.end_time,
      timeZone: "America/Indiana/Indianapolis",
    },
  };
}

/** Push a single event to Google Calendar */
export async function pushEvent(event: {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  customer_name?: string | null;
  customer_address?: string | null;
  google_event_id?: string | null;
}): Promise<{ id: string }> {
  const accessToken = await getAccessToken();
  const googleEvent = mapToGoogleEvent(event);

  if (event.google_event_id) {
    // Update existing event
    return gcalApi(`/events/${event.google_event_id}`, {
      accessToken,
      method: "PUT",
      body: googleEvent,
    });
  }

  // Create new event
  return gcalApi("/events", {
    accessToken,
    method: "POST",
    body: googleEvent,
  });
}

/** Pull events from Google Calendar for a date range */
export async function pullEvents(
  timeMin: string,
  timeMax: string
): Promise<
  Array<{
    id: string;
    summary: string;
    description: string;
    location: string;
    start: { dateTime: string };
    end: { dateTime: string };
  }>
> {
  const accessToken = await getAccessToken();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const result = await gcalApi(`/events?${params.toString()}`, { accessToken });
  return result.items ?? [];
}

/** Delete an event from Google Calendar */
export async function deleteEvent(googleEventId: string): Promise<void> {
  const accessToken = await getAccessToken();
  await gcalApi(`/events/${googleEventId}`, {
    accessToken,
    method: "DELETE",
  });
}

/** Two-way sync: pull from Google, push local changes */
export async function syncEvents(
  localEvents: Array<{
    id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    customer_name?: string | null;
    customer_address?: string | null;
    google_event_id?: string | null;
    updated_at: string;
  }>,
  timeMin: string,
  timeMax: string
): Promise<{
  pushed: number;
  pulled: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const errors: Array<{ id: string; error: string }> = [];
  let pushed = 0;
  let pulled = 0;

  // Push local events that don't have a google_event_id
  for (const event of localEvents) {
    if (!event.google_event_id) {
      try {
        await pushEvent(event);
        pushed++;
      } catch (error) {
        errors.push({
          id: event.id,
          error: error instanceof Error ? error.message : "Push failed",
        });
      }
    }
  }

  // Pull events from Google Calendar
  try {
    const googleEvents = await pullEvents(timeMin, timeMax);
    pulled = googleEvents.length;
  } catch (error) {
    errors.push({
      id: "pull",
      error: error instanceof Error ? error.message : "Pull failed",
    });
  }

  return { pushed, pulled, errors };
}
