const BUSINESS_TZ = "America/Indiana/Indianapolis";

/**
 * Convert a local HH:MM time + date to a UTC ISO string.
 * Treats the input as being in the business timezone (America/Indiana/Indianapolis).
 */
export function localTimeToUTC(date: string, time: string): string {
  const naive = new Date(`${date}T${time}:00`);
  const utcStr = naive.toLocaleString("en-US", { timeZone: "UTC" });
  const localStr = naive.toLocaleString("en-US", { timeZone: BUSINESS_TZ });
  const offset = new Date(utcStr).getTime() - new Date(localStr).getTime();
  return new Date(naive.getTime() + offset).toISOString();
}

/** Format a UTC ISO string to local time display */
export function utcToLocalDisplay(utcStr: string): string {
  return new Date(utcStr).toLocaleString("en-US", {
    timeZone: BUSINESS_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Get the local date string (YYYY-MM-DD) for a UTC timestamp */
export function utcToLocalDate(utcStr: string): string {
  return new Date(utcStr).toLocaleDateString("en-CA", {
    timeZone: BUSINESS_TZ,
  });
}

export { BUSINESS_TZ };
