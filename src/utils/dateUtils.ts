import {
  format,
  isToday,
  isTomorrow,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';

export interface CalendarDayCell {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
}

export interface DynamicHolidayEvent {
  id: string;
  name: string;
  category: 'National Holiday' | 'Public Holiday' | 'Company Festival' | 'Mandatory Holiday';
  date: Date;
  dateFormatted: string; // e.g. "27 Aug 2026"
  dayOfWeek: string;    // e.g. "Thursday"
  relativeLabel: string; // e.g. "Today", "Tomorrow", "In 3 days"
}

// Dynamically generate current year holidays
export function getDynamicHolidays(referenceDate: Date = new Date()): DynamicHolidayEvent[] {
  const currentYear = referenceDate.getFullYear();

  const baseHolidays = [
    { id: 'hol-1', name: 'Ganesh Chaturthi', category: 'Public Holiday' as const, month: 7, day: 27 }, // August is month 7 (0-indexed)
    { id: 'hol-2', name: 'Onam', category: 'Company Festival' as const, month: 7, day: 26 },
    { id: 'hol-3', name: 'Gandhi Jayanti', category: 'National Holiday' as const, month: 9, day: 2 },  // October is month 9
    { id: 'hol-4', name: 'Diwali', category: 'Company Festival' as const, month: 10, day: 8 },      // November is month 10
    { id: 'hol-5', name: 'Christmas', category: 'Public Holiday' as const, month: 11, day: 25 },     // December is month 11
    { id: 'hol-6', name: 'Independence Day', category: 'National Holiday' as const, month: 7, day: 15 },
    { id: 'hol-7', name: 'New Year Day', category: 'Public Holiday' as const, month: 0, day: 1 },
    { id: 'hol-8', name: 'Republic Day', category: 'National Holiday' as const, month: 0, day: 26 },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return baseHolidays
    .map((item) => {
      const eventDate = new Date(currentYear, item.month, item.day);
      const relativeLabel = calculateRelativeLabel(eventDate, today);

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        date: eventDate,
        dateFormatted: format(eventDate, 'dd MMM yyyy'),
        dayOfWeek: format(eventDate, 'EEEE'),
        relativeLabel,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Calculate dynamic relative label comparing targetDate vs reference today
export function calculateRelativeLabel(targetDate: Date, today: Date = new Date()): string {
  const targetStart = new Date(targetDate);
  targetStart.setHours(0, 0, 0, 0);

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  if (isSameDay(targetStart, todayStart)) {
    return 'Today';
  }

  if (isTomorrow(targetStart)) {
    return 'Tomorrow';
  }

  const daysDiff = differenceInCalendarDays(targetStart, todayStart);

  if (daysDiff > 1 && daysDiff <= 30) {
    return `In ${daysDiff} days`;
  }

  if (daysDiff < 0) {
    return `${Math.abs(daysDiff)} days ago`;
  }

  return format(targetStart, 'MMM dd');
}

// Generate calendar grid for a given month
export function getCalendarGrid(
  activeMonthDate: Date,
  events: DynamicHolidayEvent[] = []
): CalendarDayCell[] {
  const monthStart = startOfMonth(activeMonthDate);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  return days.map((date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isCurrentMonth = isSameMonth(date, monthStart);
    const todayCheck = isToday(date);
    const hasEvent = events.some((evt) => isSameDay(evt.date, date));

    return {
      date,
      dateString,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday: todayCheck,
      hasEvent,
    };
  });
}
