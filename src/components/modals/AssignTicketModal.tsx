'use client';

import React, { useState } from 'react';
import { X, UserCheck, Loader2, AlertCircle, Shield } from 'lucide-react';
import { Employee, HrTicket } from '@/types/admin';

interface AssignTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: HrTicket | null;
  hrStaffList: Employee[];
  onAssigned: (ticketNo: string, assigneeName: string) => void;
}

export const AssignTicketModal: React.FC<AssignTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  hrStaffList = [],
  onAssigned,
}) => {
  const [selectedHrId, setSelectedHrId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHrId) {
      setErrorMsg('Please select an HR staff member to assign.');
      return;
    }

    const selectedHr = hrStaffList.find((h) => (h.employeeId || h.id) === selectedHrId);
    const assigneeName = selectedHr
      ? `${selectedHr.firstName || ''} ${selectedHr.lastName || ''}`.trim() || 'HR Staff'
      : 'HR Staff';
    const assigneeAvatar = selectedHr?.photo || selectedHr?.avatar || '';

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/v1/hr-requests/${ticket.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: selectedHrId,
          assignedToName: assigneeName,
          assignedToAvatar: assigneeAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to assign ticket');
      }

      onAssigned(ticket.ticketNo, assigneeName);
      onClose();
    } catch (err: any) {
      console.error('Error assigning ticket:', err);
      setErrorMsg(err.message || 'Failed to assign ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-white">Assign Ticket {ticket.ticketNo}</h2>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">{ticket.subject}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
            <span className="font-bold">Ticket Details:</span> {ticket.requestType} • Priority: {ticket.priority} • Submitted by: {ticket.creatorName}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select HR Assignee <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedHrId}
              onChange={(e) => setSelectedHrId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              required
            >
              <option value="">-- Choose HR Staff Member --</option>
              {hrStaffList.map((hr) => {
                const hrIdStr = hr.employeeId || hr.id;
                const name = `${hr.firstName || ''} ${hr.lastName || ''}`.trim() || 'HR Staff';
                return (
                  <option key={hrIdStr} value={hrIdStr}>
                    {name} ({hr.designation || hr.department || 'HR Staff'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Confirm Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
