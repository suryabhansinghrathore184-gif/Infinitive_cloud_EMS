'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import {
  MessageSquare,
  Send,
  Paperclip,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  Lock,
  User,
  Building2,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { ConversationThread, InternalMessage } from '@/types/admin';

export default function EmployeeMessagesPage() {
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [profileData, setProfileData] = useState<any>(null);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile View Toggle (< 1024px)
  const [mobileView, setMobileView] = useState<'threads' | 'chat'>('threads');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch employee conversations and user details
  const fetchConversations = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingConversations(true);
    }
    setIsError(false);
    setErrorMessage(null);

    try {
      const [convRes, meRes] = await Promise.all([
        fetch('/api/v1/messages/conversations').catch(() => null),
        fetch('/api/v1/auth/me').catch(() => null),
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setProfileData(meData.user);
        }
      }

      if (convRes && convRes.ok) {
        const data = await convRes.json();
        if (data.success && Array.isArray(data.conversations)) {
          setConversations(data.conversations);

          if (isManualRefresh) {
            showToast('Inbox threads refreshed successfully');
          }
        } else {
          setConversations([]);
        }
      } else {
        setIsError(true);
        setErrorMessage('Unable to load HR conversations. Please try again.');
      }
    } catch (err: any) {
      console.error('Error loading employee conversations:', err);
      setIsError(true);
      setErrorMessage(err?.message || 'A network error occurred while loading messages.');
    } finally {
      setIsLoadingConversations(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Select conversation and load thread messages
  const handleSelectConversation = async (convId: string) => {
    setSelectedConvId(convId);
    setMobileView('chat');
    setIsLoadingMessages(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/messages/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedConv(data.conversation);
          setMessages(data.messages || []);

          // Clear local unread badge count for this conversation
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, unreadCountEmployee: 0 } : c))
          );
        } else {
          setErrorMessage(data.message || 'Failed to load conversation thread.');
        }
      } else {
        setErrorMessage('Failed to fetch conversation history.');
      }
    } catch (err: any) {
      console.error('Error loading conversation history:', err);
      setErrorMessage(err?.message || 'Error loading thread.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send Reply Message
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId) return;
    if (!replyText.trim() && !replyFile) return;
    if (isReplying) return;

    setIsReplying(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (replyText.trim()) formData.append('message', replyText.trim());
      if (replyFile) formData.append('file', replyFile);

      const res = await fetch(`/api/v1/messages/conversations/${selectedConvId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.reply) {
        // Append new reply to thread stream
        setMessages((prev) => [...prev, data.reply]);
        setReplyText('');
        setReplyFile(null);

        // Update thread preview in conversation list locally
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? {
                  ...c,
                  lastMessage: data.reply.message,
                  lastMessageAt: data.reply.createdAt,
                  updatedAt: data.reply.createdAt,
                }
              : c
          )
        );
      } else {
        throw new Error(data.message || 'Failed to send reply');
      }
    } catch (err: any) {
      console.error('Error sending reply:', err);
      setErrorMessage(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsReplying(false);
    }
  };

  // Handle Enter Key (Enter sends, Shift+Enter adds new line)
  const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Filter Conversations by Search Query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const subj = (c.subject || '').toLowerCase();
      const lastMsg = (c.lastMessage || '').toLowerCase();
      const empName = (c.employeeName || '').toLowerCase();
      return subj.includes(q) || lastMsg.includes(q) || empName.includes(q);
    });
  }, [conversations, searchQuery]);

  // Display Authenticated User Identity Context
  const employeeName = profileData?.name || user?.name || 'Employee';
  const employeeId = profileData?.employeeId || user?.employeeId || 'N/A';
  const designation = profileData?.designation || user?.designation || 'Team Member';
  const department = profileData?.department || user?.department || 'General';

  // Format Timestamp Helper
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="Messages"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Messages', href: '/employee/messages' },
        ]}
      >
        <div className="space-y-4 pb-8">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-fade-in border border-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* PAGE HEADER & USER CONTEXT BADGE */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Messages</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  Private & Secure
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Communicate privately and securely with HR Management regarding notices, policies, and inquiries.
              </p>

              {/* Employee Identity Context Pill */}
              <div className="flex flex-wrap items-center gap-3 pt-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200/80">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-bold text-slate-800">{employeeName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({employeeId})</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200/80">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{designation}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">{department}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => fetchConversations(true)}
                disabled={isRefreshing || isLoadingConversations}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                title="Refresh inbox threads from database"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Inbox'}</span>
              </button>
            </div>
          </div>

          {/* ERROR ALERT BANNER */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-rose-900">Failed to Load Inbox</p>
                  <p className="text-rose-700 mt-0.5">{errorMessage || 'An error occurred while connecting to HR messaging.'}</p>
                </div>
              </div>
              <button
                onClick={() => fetchConversations(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* MESSAGING CONTAINER (SPLIT SCREEN ON DESKTOP, TOGGLE ON MOBILE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-270px)] min-h-[550px]">
            {/* LEFT COLUMN: INBOX THREADS LIST */}
            <div
              className={`lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden ${
                mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Inbox Header & Search */}
              <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Inbox Threads</h2>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                    {conversations.length} {conversations.length === 1 ? 'Thread' : 'Threads'}
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search threads by subject or preview..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Thread List Stream */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                {isLoadingConversations ? (
                  /* SKELETON LOADER FOR THREADS */
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="animate-pulse flex items-start gap-3">
                        <div className="h-9 w-9 bg-slate-200 rounded-full shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-28 bg-slate-200 rounded-md"></div>
                          <div className="h-3 w-40 bg-slate-100 rounded-md"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  /* ZERO CONVERSATIONS EMPTY STATE */
                  <div className="p-8 text-center text-xs text-slate-400 my-auto">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-slate-700 text-sm">No HR Messages Yet</p>
                    <p className="mt-1.5 text-xs text-slate-500 max-w-[220px] mx-auto font-medium leading-relaxed">
                      When HR sends you a private message or notice, it will appear here.
                    </p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  /* SEARCH EMPTY STATE */
                  <div className="p-8 text-center text-xs text-slate-400 my-auto">
                    <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No matching conversations found</p>
                    <p className="mt-1 text-xs text-slate-400">Try searching with different keywords.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === selectedConvId;
                    const unreadCount = conv.unreadCountEmployee || 0;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full text-left p-3.5 flex items-start gap-3 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-indigo-50/90 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-extrabold text-xs shrink-0 shadow-2xs">
                          HR
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h3 className="text-xs font-extrabold text-slate-900 truncate">HR Administration</h3>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {formatTime(conv.lastMessageAt || conv.updatedAt)}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-indigo-900 truncate mb-0.5">{conv.subject}</p>
                          <p className="text-[11px] text-slate-500 truncate font-medium">{conv.lastMessage || 'No message content'}</p>
                        </div>

                        {unreadCount > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shrink-0 self-center shadow-xs">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: CHAT STREAM & COMPOSER */}
            <div
              className={`lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden ${
                mobileView === 'threads' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {selectedConv ? (
                <>
                  {/* CHAT HEADER */}
                  <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mobile Back Button (< 1024px) */}
                      <button
                        onClick={() => setMobileView('threads')}
                        className="lg:hidden rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                        title="Back to inbox threads"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-extrabold text-xs shrink-0 shadow-md">
                        HR
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-white truncate">HR Administration</h3>
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                            <Sparkles className="h-3 w-3 text-indigo-400" />
                            Official HR Channel
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200 font-semibold truncate">Subject: {selectedConv.subject}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectConversation(selectedConv.id)}
                      disabled={isLoadingMessages}
                      className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                      title="Reload thread messages"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingMessages ? 'animate-spin text-indigo-400' : ''}`} />
                    </button>
                  </div>

                  {/* MESSAGES STREAM AREA */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
                    {errorMessage && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {isLoadingMessages ? (
                      /* CHAT MESSAGES SKELETON */
                      <div className="space-y-4 p-4">
                        <div className="flex flex-col items-start gap-1">
                          <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                          <div className="h-12 w-64 bg-slate-200 rounded-2xl"></div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                          <div className="h-10 w-56 bg-indigo-200 rounded-2xl"></div>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = (msg.senderRole || '').toUpperCase() === 'EMPLOYEE';
                        const senderDisplayName = isMe ? 'You' : msg.senderName || 'HR Admin';
                        const timeStr = formatTime(msg.createdAt);

                        return (
                          <div
                            key={msg.id || Math.random().toString()}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-500 font-medium">
                              <span className="font-bold text-slate-700">{senderDisplayName}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-400">{timeStr}</span>
                            </div>

                            <div
                              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                                isMe
                                  ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                                  : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none font-medium'
                              }`}
                            >
                              {/* Safely render plain message text */}
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                              {/* ATTACHMENTS LIST (IF PRESENT) */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200/30 flex flex-col gap-1.5">
                                  {msg.attachments.map((att, idx) => (
                                    <a
                                      key={idx}
                                      href={att.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors ${
                                        isMe
                                          ? 'bg-indigo-700/80 hover:bg-indigo-800 text-white'
                                          : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200'
                                      }`}
                                    >
                                      <FileText className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate flex-1">{att.fileName}</span>
                                      {att.fileSize && <span className="opacity-80 text-[10px] font-mono">({att.fileSize})</span>}
                                      <Download className="h-3.5 w-3.5 shrink-0 ml-1" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* REPLY COMPOSER FORM */}
                  <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 space-y-2 shrink-0">
                    {/* Selected Attachment Pill Preview */}
                    {replyFile && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 w-fit">
                        <Paperclip className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="truncate max-w-[250px] font-semibold">{replyFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setReplyFile(null)}
                          className="text-indigo-400 hover:text-indigo-700 font-bold ml-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      {/* Attachment Selector */}
                      <label
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-indigo-100 shrink-0 mb-0.5"
                        title="Attach file"
                      >
                        <Paperclip className="h-4 w-4" />
                        <input
                          type="file"
                          onChange={(e) => e.target.files?.[0] && setReplyFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>

                      {/* Textarea Composer */}
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Write your reply to HR... (Press Enter to send, Shift+Enter for new line)"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyDownTextarea}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none max-h-32 transition-all"
                      />

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={isReplying || (!replyText.trim() && !replyFile)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs disabled:opacity-40 transition-all cursor-pointer shadow-xs shrink-0 mb-0.5"
                      >
                        {isReplying ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* NO THREAD SELECTED EMPTY STATE */
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 my-auto">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-3">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-sm">Select HR Conversation</h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-xs font-medium">
                    Select a message thread from the left to read and reply to HR Management.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
