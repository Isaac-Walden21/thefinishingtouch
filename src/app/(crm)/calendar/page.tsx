import CalendarView from "@/components/calendar/CalendarView";
import { demoCalendarEvents } from "@/lib/demo-data";

export default function CalendarPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage quote visits and team schedules.
        </p>
      </div>
      <CalendarView events={demoCalendarEvents} />
    </div>
  );
}
