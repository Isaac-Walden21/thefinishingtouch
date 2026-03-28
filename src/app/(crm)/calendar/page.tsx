import CalendarView from "@/components/calendar/CalendarView";
import PageHeader from "@/components/ui/PageHeader";
import { demoCalendarEvents } from "@/lib/demo-data";

export default function CalendarPage() {
  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      <PageHeader title="Calendar" subtitle="Manage quote visits and team schedules." />
      <CalendarView events={demoCalendarEvents} />
    </div>
  );
}
