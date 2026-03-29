const BUSINESS_TZ = "America/Indiana/Indianapolis";

/**
 * Convert a local HH:MM time + date to a UTC ISO string.
 * Treats the input as being in the business timezone (America/Indiana/Indianapolis).
 *
 * Indiana (Indianapolis) is UTC-5 (EST) or UTC-4 (EDT).
 * EDT: second Sunday of March → first Sunday of November
 */
export function localTimeToUTC(date: string, time: string): string {
  // Parse components to avoid cross-runtime Date parsing quirks
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  // Determine if date falls in EDT (UTC-4) or EST (UTC-5)
  // EDT starts second Sunday of March, ends first Sunday of November
  const isDST = isEDT(year, month, day);
  const offsetHours = isDST ? 4 : 5;

  const utcHour = hour + offsetHours;
  const utc = new Date(Date.UTC(year, month - 1, day, utcHour, minute, 0));
  return utc.toISOString();
}

function isEDT(year: number, month: number, day: number): boolean {
  if (month < 3 || month > 11) return false;
  if (month > 3 && month < 11) return true;

  if (month === 3) {
    // Second Sunday of March
    const firstDay = new Date(year, 2, 1).getDay();
    const secondSunday = firstDay === 0 ? 8 : (7 - firstDay) + 8;
    return day >= secondSunday;
  }

  // month === 11: First Sunday of November
  const firstDay = new Date(year, 10, 1).getDay();
  const firstSunday = firstDay === 0 ? 1 : (7 - firstDay) + 1;
  return day < firstSunday;
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
