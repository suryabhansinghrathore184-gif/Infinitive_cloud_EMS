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
  parseISO,
} from 'date-fns';
import { holidayService } from '@/services/holidayService';
import { ApiHolidayResponseItem } from '@/modules/holidays/holiday.entity';

export interface CalendarDayCell {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
}

/**
 * Fetches holidays dynamically from the API/Database for the year of referenceDate.
 */
export async function getDynamicHolidays(
  referenceDate: Date = new Date(),
  country: string = 'IN'
): Promise<ApiHolidayResponseItem[]> {
  const year = referenceDate.getFullYear();
  return await holidayService.getHolidays(year, { country });
}

/**
 * Dynamically calculates relative label comparing targetDate vs current date
 */
export function calculateRelativeLabel(targetDate: Date | string): string {
  const parsed = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);

  if (isToday(target)) {
    return 'Today';
  }

  if (isTomorrow(target)) {
    return 'Tomorrow';
  }

  const daysDiff = differenceInCalendarDays(target, today);

  if (daysDiff > 1 && daysDiff <= 30) {
    return `In ${daysDiff} days`;
  }

  if (daysDiff < 0) {
    return `${Math.abs(daysDiff)} days ago`;
  }

  return format(target, 'dd MMM');
}

/**
 * Generates calendar grid for active month
 */
export function getCalendarGrid(
  activeMonthDate: Date,
  events: ApiHolidayResponseItem[] = []
): CalendarDayCell[] {
  const monthStart = startOfMonth(activeMonthDate);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return days.map((date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isCurrentMonth = isSameMonth(date, monthStart);
    const todayCheck = isToday(date);
    const hasEvent = events.some((evt) => {
      const evtDateStr = evt.date.split('T')[0];
      return evtDateStr === dateString;
    });

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
