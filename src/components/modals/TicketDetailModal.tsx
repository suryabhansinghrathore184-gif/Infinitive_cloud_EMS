'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UserCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  Send,
  Paperclip,
  Loader2,
  FileText,
  Download,
  AlertCircle,
  Clock,
  User,
  ShieldAlert,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Employee, HrTicket, HrTicketComment } from '@/types/admin';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  isHrUser?: boolean;
  hrStaffList?: Employee[];
  onTicketUpdated: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  isHrUser = false,
  hrStaffList = [],
  onTicketUpdated,
}) => {
  const [ticket, setTicket] = useState<HrTicket | null>(null);
  const [comments, setComments] = useState<HrTicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Action States
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedHrId, setSelectedHrId] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/v1/hr-requests/${ticketId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load ticket details');
      }
      setTicket(data.ticket);
      setComments(data.comments || []);
    } catch (err: any) {
      console.error('Error loading ticket detail:', err);
      setErrorMsg(err.message || 'Failed to load ticket details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicketDetails();
      setIsAssigning(false);
      setIsResolving(false);
    }
  }, [isOpen, ticketId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  if (!isOpen || !ticketId) return null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentFile) return;

    setIsPostingComment(true);
    try {
      const formData = new FormData();
      formData.append('comment', commentText.trim());
      if (isHrUser) formData.append('isInternal', String(isInternalNote));
      if (commentFile) formData.append('file', commentFile);

      const res = await fetch(`/api/v1/hr-requests/${ticketId}/comments`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setCommentText('');
        setCommentFile(null);
        setIsInternalNote(false);
        onTicketUpdated();
      } else {
        alert(data.message || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Error posting comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedHrId) return;
    const hrEmp = hrStaffList.find((h) => (h.employeeId || h.id) === selectedHrId);
    const assigneeName = hrEmp ? `${hrEmp.firstName || ''} ${hrEmp.lastName || ''}`.trim() || 'HR Staff' : 'HR Staff';

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/hr-requests/${ticketId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: selectedHrId,
          assignedToName: assigneeName,
          assignedToAvatar: hrEmp?.photo || hrEmp?.avatar || '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAssigning(false);
        fetchTicketDetails();
        onTicketUpdated();
      } else {
        alert(data.message || 'Failed to assign ticket');
      }
    } catch (err) {
      alert('Error assigning ticket');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleStatusChange = async (targetStatus: string) => {
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/hr-requests/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (data.success) {
        fetchTicketDetails();
        onTicketUpdated();
      } else {
        alert(data.message || 'Failed to update ticket status');
      }
    } catch (err) {
      alert('Error updating ticket status');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!resolutionText.trim()) {
      alert('Please enter resolution notes before marking resolved.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/hr-requests/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: resolutionText.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setIsResolving(false);
        setResolutionText('');
        fetchTicketDetails();
        onTicketUpdated();
      } else {
        alert(data.message || 'Failed to resolve ticket');
      }
    } catch (err) {
      alert('Error resolving ticket');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/hr-requests/${ticketId}/close`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        fetchTicketDetails();
        onTicketUpdated();
      } else {
        alert(data.message || 'Failed to close ticket');
      }
    } catch (err) {
      alert('Error closing ticket');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'Medium':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Assigned':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Closed':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const statusSteps = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {ticket?.ticketNo || 'HR Ticket'}
            </span>
            {ticket && (
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs border ${getPriorityBadgeClass(ticket.priority)}`}>
                  {ticket.priority} Priority
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading ticket details...</span>
          </div>
        ) : errorMsg || !ticket ? (
          <div className="p-8 text-center text-xs text-red-600 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <p>{errorMsg || 'Failed to load ticket'}</p>
            <button onClick={fetchTicketDetails} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl">
              Retry
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {/* Employee & Subject Info Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {ticket.creatorAvatar ? (
                    <img
                      src={ticket.creatorAvatar}
                      alt={ticket.creatorName}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      {ticket.creatorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{ticket.creatorName}</h3>
                    <p className="text-xs text-slate-500">
                      ID: {ticket.employeeId} {ticket.department ? `• ${ticket.department}` : ''} {ticket.email ? `• ${ticket.email}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>Submitted: <span className="font-semibold text-slate-700">{new Date(ticket.createdAt).toLocaleString()}</span></p>
                  <p className="mt-0.5">Assigned To: <span className="font-bold text-indigo-700">{ticket.assignedToName || 'Unassigned'}</span></p>
                </div>
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider mb-1.5 border border-indigo-100">
                  {ticket.requestType}
                </span>
                <h2 className="text-base font-bold text-slate-900">{ticket.subject}</h2>
                <p className="mt-2 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                  {ticket.description}
                </p>
              </div>

              {/* Resolution Summary (If resolved/closed) */}
              {ticket.resolution && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resolution Summary:</span>
                  </div>
                  <p className="leading-relaxed">{ticket.resolution}</p>
                </div>
              )}

              {/* Initial File Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Uploaded Attachments:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{att.fileName}</span>
                        <Download className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lifecycle Progress Stepper */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
              <h4 className="font-bold text-slate-900 mb-3">Ticket Lifecycle Progress</h4>
              <div className="flex items-center justify-between relative">
                {statusSteps.map((step, idx) => {
                  const currentIdx = statusSteps.indexOf(ticket.status || 'Open');
                  const isPassed = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step} className="flex flex-col items-center z-10 flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                          isCurrent
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isPassed && !isCurrent ? '✓' : idx + 1}
                      </div>
                      <span className={`mt-1 text-[11px] font-semibold ${isCurrent ? 'text-indigo-600 font-bold' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HR Action Controls (HR/Admin Only) */}
            {isHrUser && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">HR Management Controls</h4>

                {/* Inline Assignment Form */}
                {isAssigning && (
                  <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-indigo-900 block">Assign Ticket to Staff Member:</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedHrId}
                        onChange={(e) => setSelectedHrId(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                      >
                        <option value="">-- Choose HR Staff Member --</option>
                        {hrStaffList.map((hr) => (
                          <option key={hr.employeeId || hr.id} value={hr.employeeId || hr.id}>
                            {`${hr.firstName || ''} ${hr.lastName || ''}`.trim()} ({hr.designation || 'HR'})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssignTicket}
                        disabled={isSubmittingAction}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => setIsAssigning(false)}
                        className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-medium text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Resolution Form */}
                {isResolving && (
                  <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-emerald-900 block">Provide Resolution Summary:</span>
                    <textarea
                      rows={3}
                      placeholder="Write the resolution steps or summary provided to employee..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setIsResolving(false)}
                        className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-medium text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResolveTicket}
                        disabled={isSubmittingAction}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setIsAssigning(!isAssigning)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Assign HR Staff</span>
                  </button>

                  {ticket.status !== 'In Progress' && ticket.status !== 'Closed' && ticket.status !== 'Resolved' && (
                    <button
                      onClick={() => handleStatusChange('In Progress')}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start In Progress</span>
                    </button>
                  )}

                  {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                    <button
                      onClick={() => setIsResolving(!isResolving)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve Request</span>
                    </button>
                  )}

                  {ticket.status !== 'Closed' && (
                    <button
                      onClick={handleCloseTicket}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-600 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close Ticket</span>
                    </button>
                  )}

                  {ticket.status === 'Closed' && (
                    <button
                      onClick={() => handleStatusChange('Open')}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-open Ticket</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Conversation Thread */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                <span>Discussion & Conversation Thread</span>
                <span className="text-indigo-600 font-semibold">{comments.length} Messages</span>
              </h3>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No comments or notes added yet.
                  </div>
                ) : (
                  comments.map((cmt) => {
                    const isMe = cmt.authorRole === 'EMPLOYEE' ? !isHrUser : isHrUser;
                    return (
                      <div
                        key={cmt.id}
                        className={`flex flex-col ${
                          cmt.isInternal
                            ? 'bg-purple-50/80 border border-purple-200 rounded-2xl p-3'
                            : isMe
                            ? 'items-end'
                            : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-700">
                            {cmt.authorName} ({cmt.authorRole})
                          </span>
                          {cmt.isInternal && (
                            <span className="flex items-center gap-1 px-1.5 py-0.2 bg-purple-600 text-white rounded text-[9px] font-bold">
                              <Lock className="w-2.5 h-2.5" /> Internal HR Note
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(cmt.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div
                          className={`px-4 py-2.5 text-xs leading-relaxed rounded-2xl ${
                            cmt.isInternal
                              ? 'bg-transparent text-purple-950 p-0 shadow-none'
                              : isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm max-w-[80%]'
                              : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none max-w-[80%]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{cmt.comment}</p>

                          {cmt.attachments && cmt.attachments.length > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-white/20 flex flex-col gap-1">
                              {cmt.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 text-[10px] font-semibold underline hover:opacity-80"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{att.fileName}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-100 space-y-2">
                {commentFile && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 w-fit font-medium">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{commentFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setCommentFile(null)}
                      className="text-indigo-400 hover:text-indigo-700 font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <input
                      type="file"
                      onChange={(e) => e.target.files?.[0] && setCommentFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    placeholder={isHrUser && isInternalNote ? "Write private internal HR note..." : "Write a response to thread..."}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />

                  <button
                    type="submit"
                    disabled={isPostingComment || (!commentText.trim() && !commentFile)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs disabled:opacity-40 transition-all shadow-md shadow-indigo-600/20"
                  >
                    {isPostingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Internal HR Note Checkbox */}
                {isHrUser && (
                  <div className="flex items-center gap-2 pt-1 pl-1">
                    <input
                      type="checkbox"
                      id="internalNoteCheck"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <label htmlFor="internalNoteCheck" className="text-[11px] font-semibold text-purple-900 cursor-pointer flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-600" />
                      <span>Internal HR Note (Private - HR staff eyes only)</span>
                    </label>
                  </div>
                )}
              </form>
            </div>

            {/* History / Audit Log */}
            {ticket.history && ticket.history.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Ticket Activity History</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {ticket.history.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 border-b border-slate-50 pb-1">
                      <span className="font-medium text-slate-800">{h.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {h.performedBy} • {new Date(h.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
