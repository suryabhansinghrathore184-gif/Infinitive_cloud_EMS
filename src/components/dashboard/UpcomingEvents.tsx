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
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Filter,
  X,
} from 'lucide-react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { holidayService } from '@/services/holidayService';
import { ApiHolidayResponseItem, HolidayCategoryType } from '@/modules/holidays/holiday.entity';
import { getCalendarGrid, CalendarDayCell } from '@/utils/dateUtils';
import { CreateHolidayDto } from '@/modules/holidays/holiday.dto';

export const UpcomingEvents: React.FC = () => {
  const [activeMonthDate, setActiveMonthDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<ApiHolidayResponseItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Add Holiday Form State
  const [newHoliday, setNewHoliday] = useState<CreateHolidayDto>({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'PUBLIC_HOLIDAY',
    country: 'IN',
    state: '',
    isOptional: false,
    isMandatory: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch holidays dynamically from API / Service for active year
  const loadHolidays = async () => {
    setIsLoading(true);
    const selectedYear = activeMonthDate.getFullYear();
    const data = await holidayService.getHolidays(selectedYear, { country: 'IN' });
    setHolidays(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHolidays();
  }, [activeMonthDate]);

  const filteredHolidays = holidays.filter((h) => {
    if (selectedCategory === 'ALL') return true;
    return h.category === selectedCategory;
  });

  const calendarGrid: CalendarDayCell[] = getCalendarGrid(activeMonthDate, holidays);

  const handlePrevMonth = () => setActiveMonthDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setActiveMonthDate((prev) => addMonths(prev, 1));
  const handleJumpToToday = () => setActiveMonthDate(new Date());

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) {
      showToast('Holiday name and date are required.');
      return;
    }

    const res = await holidayService.createHoliday(newHoliday);
    if (res.success) {
      showToast(`Holiday "${newHoliday.name}" added successfully.`);
      setIsAddModalOpen(false);
      setNewHoliday({
        name: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: 'PUBLIC_HOLIDAY',
        country: 'IN',
        state: '',
        isOptional: false,
        isMandatory: true,
      });
      loadHolidays();
    } else {
      showToast(`Error: ${res.message}`);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    const res = await holidayService.deleteHoliday(id);
    if (res.success) {
      showToast(`Deleted "${name}" from holiday schedule.`);
      loadHolidays();
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'NATIONAL_HOLIDAY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPANY_FESTIVAL':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'COMPANY_HOLIDAY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OPTIONAL_HOLIDAY':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'PUBLIC_HOLIDAY':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'NATIONAL_HOLIDAY':
        return <Flag className="h-4 w-4 text-emerald-600" />;
      case 'COMPANY_FESTIVAL':
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'COMPANY_HOLIDAY':
        return <Building2 className="h-4 w-4 text-amber-600" />;
      default:
        return <CalendarIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const weekDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute right-6 top-4 z-30 flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-white shadow-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Card Header & Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Upcoming Holidays & Festivals</h3>
          <p className="text-xs text-slate-500">
            Official company calendar for {format(activeMonthDate, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            title="Add New Holiday"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
          className="rounded-lg p-1 text-slate-600 hover:bg-white hover:text-slate-900"
          title="Previous Month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span>{format(activeMonthDate, 'MMMM yyyy')}</span>
          <button
            onClick={handleJumpToToday}
            className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100"
          >
            Today
          </button>
        </div>

        <button
          onClick={handleNextMonth}
          className="rounded-lg p-1 text-slate-600 hover:bg-white hover:text-slate-900"
          title="Next Month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Category Filter Bar */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {['ALL', 'PUBLIC_HOLIDAY', 'NATIONAL_HOLIDAY', 'COMPANY_FESTIVAL', 'OPTIONAL_HOLIDAY'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* VIEW 1: MONTH CALENDAR GRID */}
      {viewMode === 'calendar' ? (
        <div className="mt-4">
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400">
            {weekDayNames.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
            {calendarGrid.map((cell, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col items-center justify-center rounded-xl p-2 ${
                  cell.isToday
                    ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-400/50'
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
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VIEW 2: HOLIDAY EVENTS LIST (Dynamic API Data) */
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
              Loading API Holiday Schedule...
            </div>
          ) : filteredHolidays.length > 0 ? (
            filteredHolidays.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all hover:bg-slate-100/70"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200">
                    {getCategoryIcon(event.category)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{event.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${getCategoryBadgeStyle(
                          event.category
                        )}`}
                      >
                        {event.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {event.dayOfWeek}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="block rounded-lg border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-bold text-slate-900">
                      {event.date}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold text-blue-600">
                      {event.relativeLabel}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(event.id, event.name)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete Holiday"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No holiday records found for this filter.
            </div>
          )}
        </div>
      )}

      {/* ADMIN ADD HOLIDAY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5 text-xs text-slate-800">
            <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
              <span>Add Holiday to Master API Schedule</span>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateHoliday} className="mt-4 space-y-3">
              <div>
                <label className="font-bold text-slate-900">Holiday / Festival Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Date (YYYY-MM-DD) *</label>
                <input
                  type="date"
                  required
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Category *</label>
                <select
                  value={newHoliday.category}
                  onChange={(e) =>
                    setNewHoliday({ ...newHoliday, category: e.target.value as HolidayCategoryType })
                  }
                  className="mt-1 w-full rounded-xl border p-2 bg-white focus:border-blue-500"
                >
                  <option value="PUBLIC_HOLIDAY">PUBLIC_HOLIDAY</option>
                  <option value="NATIONAL_HOLIDAY">NATIONAL_HOLIDAY</option>
                  <option value="COMPANY_HOLIDAY">COMPANY_HOLIDAY</option>
                  <option value="COMPANY_FESTIVAL">COMPANY_FESTIVAL</option>
                  <option value="OPTIONAL_HOLIDAY">OPTIONAL_HOLIDAY</option>
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newHoliday.isMandatory}
                    onChange={(e) => setNewHoliday({ ...newHoliday, isMandatory: e.target.checked })}
                    className="h-3.5 w-3.5"
                  />
                  Mandatory Off
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newHoliday.isOptional}
                    onChange={(e) => setNewHoliday({ ...newHoliday, isOptional: e.target.checked })}
                    className="h-3.5 w-3.5"
                  />
                  Optional Off
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
