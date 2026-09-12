'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useEmsStore } from '@/store/emsStore';
import {
  Megaphone,
  Plus,
  BellOff,
  CheckCircle2,
  Globe,
  Lock,
  Edit3,
  Trash2,
  Eye,
  Search,
  Filter,
  MessageSquare,
  Send,
  Paperclip,
  User,
  Clock,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  Mail,
  Building2,
  X,
} from 'lucide-react';
import { AnnouncementItem } from '@/types/dashboard';
import { ConversationThread, InternalMessage } from '@/types/admin';

// Modals
import { CreateAnnouncementModal } from '@/components/modals/CreateAnnouncementModal';
import { PreviewAnnouncementModal } from '@/components/modals/PreviewAnnouncementModal';
import { NewMessageModal } from '@/components/modals/NewMessageModal';

export default function CommunicationPage() {
  const { state, setAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useEmsStore();

  // Navigation State
  const [moduleTab, setModuleTab] = useState<'BROADCASTS' | 'MESSAGES'>('MESSAGES');

  // Announcement State
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLIC' | 'INTERNAL' | 'DRAFT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Partial<AnnouncementItem> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Internal Messaging State
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  // Reply Form State
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [convSearchTerm, setConvSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Announcements
  const fetchLiveAnnouncements = async () => {
    try {
      const res = await fetch('/api/v1/announcements');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAnnouncements(data.data);
      }
    } catch (e) {
      console.error('Failed to load server announcements', e);
    }
  };

  // Fetch Conversations
  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/v1/messages/conversations');
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !selectedConvId) {
          handleSelectConversation(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchLiveAnnouncements();
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = async (convId: string) => {
    setSelectedConvId(convId);
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/v1/messages/conversations/${convId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConv(data.conversation);
        setMessages(data.messages || []);

        // Update unread status in list locally
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCountHr: 0 } : c))
        );
      }
    } catch (e) {
      console.error('Error fetching conversation details:', e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId) return;
    if (!replyText.trim() && !replyFile) return;

    setIsReplying(true);
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
        setMessages((prev) => [...prev, data.reply]);
        setReplyText('');
        setReplyFile(null);

        // Update last message in list
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
        alert(data.message || 'Failed to send reply');
      }
    } catch (e: any) {
      console.error('Error sending reply:', e);
      alert('Error sending reply');
    } finally {
      setIsReplying(false);
    }
  };

  const announcements = state.announcements || [];
  const employees = state.employees || [];

  const handleSaveAnnouncement = async (ann: Partial<AnnouncementItem>) => {
    try {
      const res = await fetch('/api/v1/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ann),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAnnouncements(data.data);
        showToast(data.message || `Announcement "${ann.title}" saved successfully.`);
      } else {
        createAnnouncement(ann);
        showToast(`Announcement "${ann.title}" saved locally.`);
      }
    } catch (e) {
      createAnnouncement(ann);
      showToast(`Saved announcement "${ann.title}".`);
    }
    setEditingAnnouncement(null);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await fetch(`/api/v1/announcements/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    deleteAnnouncement(id);
    showToast('Announcement deleted successfully.');
  };

  // Filtered Lists
  const filteredAnnouncements = announcements.filter((ann) => {
    const matchSearch =
      ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ann.category && ann.category.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (activeTab === 'PUBLIC') return ann.visibility === 'Public Website' && ann.status === 'Published';
    if (activeTab === 'INTERNAL') return ann.visibility === 'Internal Only' || !ann.visibility;
    if (activeTab === 'DRAFT') return ann.status === 'Draft';
    return true;
  });

  const filteredConversations = conversations.filter((c) => {
    const term = convSearchTerm.toLowerCase();
    return (
      c.employeeName.toLowerCase().includes(term) ||
      c.subject.toLowerCase().includes(term) ||
      c.lastMessage.toLowerCase().includes(term) ||
      (c.department && c.department.toLowerCase().includes(term))
    );
  });

  return (
    <AdminLayout
      pageTitle="Communication Hub"
      breadcrumbs={[{ label: 'Communication', href: '/admin/communication' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Module Tabs (Broadcasts vs Private Messages) */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-4">
        <button
          onClick={() => setModuleTab('MESSAGES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            moduleTab === 'MESSAGES'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>HR Employee Direct Messages</span>
          {conversations.reduce((acc, c) => acc + (c.unreadCountHr || 0), 0) > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
              {conversations.reduce((acc, c) => acc + (c.unreadCountHr || 0), 0)}
            </span>
          )}
        </button>
        <button
          onClick={() => setModuleTab('BROADCASTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            moduleTab === 'BROADCASTS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcast Announcements ({announcements.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODULE 1: HR DIRECT MESSAGING                                             */}
      {/* ========================================================================= */}
      {moduleTab === 'MESSAGES' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Private Internal Messaging</h2>
              <p className="text-xs text-slate-500">
                1-on-1 private channels between HR Administration and Individual Employees
              </p>
            </div>
            <button
              onClick={() => setIsNewMessageModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Message</span>
            </button>
          </div>

          {/* Messages Layout (Inbox + Chat Window) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-280px)] min-h-[520px]">
            {/* Left Column: Inbox List */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={convSearchTerm}
                    onChange={(e) => setConvSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading conversations...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No conversations found</p>
                    <p className="mt-1 text-[11px]">Click &quot;New Message&quot; to initiate a thread with an employee.</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === selectedConvId;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative shrink-0">
                          {conv.employeeAvatar ? (
                            <img
                              src={conv.employeeAvatar}
                              alt={conv.employeeName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                              {conv.employeeName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {(conv.unreadCountHr || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                              {conv.unreadCountHr}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{conv.employeeName}</h4>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-indigo-900 truncate mb-1">{conv.subject}</p>
                          <p className="text-[11px] text-slate-500 truncate">{conv.lastMessage}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Chat Detail */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-bold text-sm">
                        {selectedConv.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          {selectedConv.employeeName}
                          {selectedConv.department && (
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {selectedConv.department}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-indigo-300 font-medium">Subject: {selectedConv.subject}</p>
                      </div>
                    </div>
                  </div>

                  {/* Message History Stream */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full text-xs text-slate-400 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Loading messages...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        No messages in this thread yet.
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isHr = msg.senderRole?.toUpperCase() !== 'EMPLOYEE';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isHr ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-slate-600">
                                {isHr ? 'HR Admin' : msg.senderName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                                isHr
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.message}</p>

                              {/* Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-white/20 flex flex-col gap-1.5">
                                  {msg.attachments.map((att, idx) => (
                                    <a
                                      key={idx}
                                      href={att.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                                        isHr
                                          ? 'bg-indigo-700/60 hover:bg-indigo-800 text-white'
                                          : 'bg-slate-100 hover:bg-slate-200 text-indigo-700'
                                      }`}
                                    >
                                      <FileText className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate flex-1">{att.fileName}</span>
                                      <Download className="w-3.5 h-3.5 shrink-0" />
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

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 space-y-2">
                    {replyFile && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 w-fit">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[250px] font-medium">{replyFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setReplyFile(null)}
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
                          onChange={(e) => e.target.files?.[0] && setReplyFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="text"
                        placeholder="Write your reply to employee..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />

                      <button
                        type="submit"
                        disabled={isReplying || (!replyText.trim() && !replyFile)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs disabled:opacity-40 transition-all"
                      >
                        {isReplying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
                  <h3 className="font-bold text-slate-700 text-sm">Select a Conversation</h3>
                  <p className="text-xs text-slate-500 mt-1">Choose a conversation from the left sidebar to view messages.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 2: BROADCAST ANNOUNCEMENTS                                         */}
      {/* ========================================================================= */}
      {moduleTab === 'BROADCASTS' && (
        <div className="space-y-4">
          {/* Header Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Announcements & Public Broadcasts</h2>
              <p className="text-xs text-slate-500">
                Publish internal HR policy notices or public website announcements connected to company portal
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create Announcement</span>
            </button>
          </div>

          {/* Tabs & Search Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs">
            <div className="flex items-center gap-2 font-bold text-xs border-b sm:border-b-0 pb-2 sm:pb-0">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`rounded-xl px-3 py-1.5 transition ${
                  activeTab === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Broadcasts ({announcements.length})
              </button>
              <button
                onClick={() => setActiveTab('PUBLIC')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 transition ${
                  activeTab === 'PUBLIC' ? 'bg-emerald-600 text-white' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>
                  Public Website (
                  {announcements.filter((a) => a.visibility === 'Public Website' && a.status === 'Published').length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('INTERNAL')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 transition ${
                  activeTab === 'INTERNAL' ? 'bg-blue-600 text-white' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Internal Only</span>
              </button>
              <button
                onClick={() => setActiveTab('DRAFT')}
                className={`rounded-xl px-3 py-1.5 transition ${
                  activeTab === 'DRAFT' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                Drafts ({announcements.filter((a) => a.status === 'Draft').length})
              </button>
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, category, content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 bg-slate-50 text-xs focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Grid of Announcements */}
          {filteredAnnouncements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
                <BellOff className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">No announcements match selected filter</h4>
              <p className="mt-1 max-w-xs mx-auto text-xs text-slate-500">
                Click &quot;+ Create Announcement&quot; to publish a new internal or public broadcast notice.
              </p>
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setIsAddModalOpen(true);
                }}
                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
              >
                + Create Announcement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700 text-[10px]">
                        {ann.category || 'General'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            ann.visibility === 'Public Website'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {ann.visibility === 'Public Website' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {ann.visibility || 'Internal Only'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            ann.status === 'Published'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : ann.status === 'Draft'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {ann.status || 'Published'}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-900">{ann.title}</h3>
                    {ann.shortDescription && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{ann.shortDescription}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">{ann.content}</p>
                  </div>

                  <div className="mt-4 border-t pt-3 border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">{ann.date || 'Today'}</span>

                    <div className="flex items-center gap-1">
                      {ann.visibility === 'Public Website' && (
                        <button
                          title="Preview on Website"
                          onClick={() => setPreviewAnnouncement(ann)}
                          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        title="Edit Announcement"
                        onClick={() => {
                          setEditingAnnouncement(ann);
                          setIsAddModalOpen(true);
                        }}
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete Announcement"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateAnnouncementModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSave={handleSaveAnnouncement}
        onPreview={(ann) => setPreviewAnnouncement(ann)}
        initialData={editingAnnouncement}
      />

      <PreviewAnnouncementModal
        isOpen={!!previewAnnouncement}
        onClose={() => setPreviewAnnouncement(null)}
        announcement={previewAnnouncement}
      />

      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        employees={employees}
        onMessageSent={(newConv) => {
          setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
          handleSelectConversation(newConv.id);
          showToast(`Message sent to ${newConv.employeeName}`);
        }}
      />
    </AdminLayout>
  );
}
