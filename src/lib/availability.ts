import { supabase } from "./supabase";
import type { AvailabilityRule, CalendarEvent, TimeSlot } from "./types";
import { localTimeToUTC } from "./timezone";

const SLOT_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get available 1-hour slots for a date range.
 * Computes from availability rules minus existing events.
 */
export async function getAvailableSlots(
  startDate: string, // YYYY-MM-DD
  endDate: string,
  teamMemberId?: string
): Promise<TimeSlot[]> {
  // 1. Fetch availability rules
  let rulesQuery = supabase
    .from("availability_rules")
    .select("*")
    .eq("is_enabled", true);

  if (teamMemberId) {
    rulesQuery = rulesQuery.eq("team_member_id", teamMemberId);
  }

  const { data: rules, error: rulesError } = await rulesQuery;
  if (rulesError) throw new Error(`Failed to fetch rules: ${rulesError.message}`);
  if (!rules || rules.length === 0) return [];

  // 2. Fetch team members for names
  const teamMemberIds = [...new Set(rules.map((r: AvailabilityRule) => r.team_member_id))];
  const { data: members } = await supabase
    .from("team_members")
    .select("id, name")
    .in("id", teamMemberIds)
    .eq("is_active", true);

  const memberMap = new Map((members ?? []).map((m: { id: string; name: string }) => [m.id, m.name]));

  // 3. Fetch existing events in range (only scheduled ones block availability)
  const rangeStart = localTimeToUTC(startDate, "00:00");
  const rangeEnd = localTimeToUTC(endDate, "23:59");

  let eventsQuery = supabase
    .from("calendar_events")
    .select("team_member_id, start_time, end_time")
    .eq("status", "scheduled")
    .gte("start_time", rangeStart)
    .lte("end_time", rangeEnd);

  if (teamMemberId) {
    eventsQuery = eventsQuery.eq("team_member_id", teamMemberId);
  }

  const { data: events } = await eventsQuery;
  const bookedSlots = (events ?? []) as Pick<CalendarEvent, "team_member_id" | "start_time" | "end_time">[];

  // 4. Generate slots from rules
  const slots: TimeSlot[] = [];
  const current = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();

    // Find matching rules for this day
    const dayRules = rules.filter(
      (r: AvailabilityRule) => r.day_of_week === dayOfWeek
    );

    for (const rule of dayRules) {
      const memberName = memberMap.get(rule.team_member_id);
      if (!memberName) continue;

      // Generate 1-hour slots within the rule window
      const ruleStartUTC = localTimeToUTC(dateStr, rule.start_time);
      const ruleEndUTC = localTimeToUTC(dateStr, rule.end_time);
      let slotStart = new Date(ruleStartUTC);
      const ruleEndDate = new Date(ruleEndUTC);

      while (slotStart.getTime() + SLOT_DURATION_MS <= ruleEndDate.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MS);

        // Check if slot overlaps with any existing event
        const isBooked = bookedSlots.some(
          (evt) =>
            evt.team_member_id === rule.team_member_id &&
            new Date(evt.start_time) < slotEnd &&
            new Date(evt.end_time) > slotStart
        );

        // Only return future slots
        if (!isBooked && slotStart > new Date()) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            team_member_id: rule.team_member_id,
            team_member_name: memberName,
          });
        }

        slotStart = slotEnd;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}
