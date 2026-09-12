'use client';

import React, { useState } from 'react';
import { X, Clock, CheckCircle2 } from 'lucide-react';
import { AttendanceRecord } from '@/types/admin';
import { mockEmployees } from '@/data/employees';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: { id: string; firstName: string; lastName: string; employeeId: string; avatar?: string }[];
  onSave: (record: Omit<AttendanceRecord, 'id' | 'workingHours'>) => void;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSave,
}) => {
  const availableEmployees = employees && employees.length > 0 ? employees : mockEmployees;

  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkIn, setCheckIn] = useState('09:00 AM');
  const [checkOut, setCheckOut] = useState('06:00 PM');
  const [breakDuration, setBreakDuration] = useState('1 hr');
  const [status, setStatus] = useState<AttendanceRecord['status']>('Present');
  const [method, setMethod] = useState<AttendanceRecord['method']>('Manual Admin Entry' as any);
  const [location, setLocation] = useState('Enterprise HQ');

  if (!isOpen) return null;

  const handleEmployeeSelect = (empId: string) => {
    setEmployeeId(empId);
    const target = availableEmployees.find((e) => e.employeeId === empId);
    if (target) {
      setEmployeeName(`${target.firstName} ${target.lastName}`);
      setAvatar(target.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80');
    } else {
      setEmployeeName('');
      setAvatar('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !employeeName) return;

    onSave({
      employeeId,
      employeeName,
      avatar: avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      date,
      checkIn: status === 'Absent' ? '--' : checkIn,
      checkOut: status === 'Absent' ? '--' : checkOut,
      breakDuration: status === 'Absent' ? '--' : breakDuration,
      status,
      method: method || 'Web',
      location,
    });

    setEmployeeId('');
    setEmployeeName('');
    setAvatar('');
    setStatus('Present');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Mark / Log Employee Attendance</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Select Employee *</label>
            <select
              required
              value={employeeId}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-semibold text-slate-900"
            >
              <option value="">-- Choose Employee --</option>
              {availableEmployees.map((emp) => (
                <option key={emp.id} value={emp.employeeId}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900">Attendance Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceRecord['status'])}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white font-semibold"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Half Day">Half Day</option>
                <option value="Work From Home">Work From Home</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          {status !== 'Absent' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-900">Check-In Time</label>
                <input
                  type="text"
                  placeholder="09:00 AM"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Check-Out Time</label>
                <input
                  type="text"
                  placeholder="06:00 PM"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900">Break Duration</label>
                <input
                  type="text"
                  placeholder="1 hr"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2 bg-slate-50 focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Logging Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              >
                <option value="Web">Web Check-in</option>
                <option value="Biometric">Biometric Punch</option>
                <option value="Mobile">Mobile App</option>
                <option value="RFID">RFID Card</option>
                <option value="Manual Admin Entry">Manual Admin Entry</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Work Location</label>
              <input
                type="text"
                placeholder="Enterprise HQ"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!employeeId}
              className="rounded-xl bg-blue-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
            >
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
