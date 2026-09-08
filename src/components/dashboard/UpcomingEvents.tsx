'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Flag,
  Sparkles,
  Building2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListFilter,
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import {
  getDynamicHolidays,
  getCalendarGrid,
  DynamicHolidayEvent,
  CalendarDayCell,
} from '@/utils/dateUtils';

export const UpcomingEvents: React.FC = () => {
  const [activeMonthDate, setActiveMonthDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<DynamicHolidayEvent[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDateEvents, setSelectedDateEvents] = useState<DynamicHolidayEvent[] | null>(null);

  useEffect(() => {
    // Calculate real dynamic holidays from current system date
    const dynamicEvents = getDynamicHolidays(activeMonthDate);
    setHolidays(dynamicEvents);
  }, [activeMonthDate]);

  const calendarGrid: CalendarDayCell[] = getCalendarGrid(activeMonthDate, holidays);

  const handlePrevMonth = () => {
    setActiveMonthDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setActiveMonthDate((prev) => addMonths(prev, 1));
  };

  const handleJumpToToday = () => {
    setActiveMonthDate(new Date());
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'National Holiday':
        return <Flag className="h-4 w-4 text-emerald-600" />;
      case 'Company Festival':
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'Public Holiday':
      default:
        return <Building2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'National Holiday':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Company Festival':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Public Holiday':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const weekDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Card Header & Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Upcoming Holidays & Festivals</h3>
          <p className="text-xs text-slate-500">
            Real calendar events for {format(activeMonthDate, 'MMMM yyyy')}
          </p>
        </div>

        {/* View Toggle & Month Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            title={viewMode === 'list' ? 'Switch to Month Calendar View' : 'Switch to Event List View'}
          >
            {viewMode === 'list' ? (
              <>
                <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                <span>Calendar</span>
              </>
            ) : (
              <>
                <ListFilter className="h-3.5 w-3.5 text-blue-600" />
                <span>List View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Month Navigation Control Bar */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs font-semibold text-slate-800">
        <button
          onClick={handlePrevMonth}
          className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
          title="Previous Month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span>{format(activeMonthDate, 'MMMM yyyy')}</span>
          <button
            onClick={handleJumpToToday}
            className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
          >
            Today
          </button>
        </div>

        <button
          onClick={handleNextMonth}
          className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
          title="Next Month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* VIEW 1: MONTH CALENDAR GRID */}
      {viewMode === 'calendar' ? (
        <div className="mt-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400">
            {weekDayNames.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
            {calendarGrid.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (cell.hasEvent) {
                    const matched = holidays.filter(
                      (h) => format(h.date, 'yyyy-MM-dd') === cell.dateString
                    );
                    setSelectedDateEvents(matched);
                  }
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl p-2 transition-all ${
                  cell.isToday
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50'
                    : cell.isCurrentMonth
                    ? 'text-slate-800 hover:bg-slate-100'
                    : 'text-slate-300'
                }`}
              >
                <span>{cell.dayNumber}</span>
                {cell.hasEvent && (
                  <span
                    className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                      cell.isToday ? 'bg-white' : 'bg-purple-600'
                    }`}
                  ></span>
                )}
              </button>
            ))}
          </div>

          {/* Selected Date Event Popover */}
          {selectedDateEvents && (
            <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900">Event Details</span>
                <button
                  onClick={() => setSelectedDateEvents(null)}
                  className="text-[10px] text-purple-700 hover:underline"
                >
                  Close
                </button>
              </div>
              {selectedDateEvents.map((evt) => (
                <div key={evt.id} className="mt-1.5 text-purple-800 font-medium">
                  • {evt.name} ({evt.category}) - {evt.dateFormatted}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: HOLIDAY EVENTS LIST */
        <div className="mt-4 space-y-3">
          {holidays.length > 0 ? (
            holidays.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all hover:bg-slate-100/70 hover:shadow-2xs"
              >
                {/* Event Name & Category */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs">
                    {getCategoryIcon(event.category)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{event.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getCategoryBadgeStyle(
                          event.category
                        )}`}
                      >
                        {event.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {event.dayOfWeek}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real Date & Dynamic Relative Label */}
                <div className="text-right">
                  <span className="block rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow-2xs">
                    {event.dateFormatted}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold text-blue-600">
                    {event.relativeLabel}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No official holidays recorded for {format(activeMonthDate, 'MMMM yyyy')}.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
