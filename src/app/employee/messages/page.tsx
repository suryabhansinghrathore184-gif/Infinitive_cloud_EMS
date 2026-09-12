'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import {
  MessageSquare,
  Send,
  Paperclip,
  Loader2,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
} from 'lucide-react';
import { ConversationThread, InternalMessage } from '@/types/admin';

export default function EmployeeMessagesPage() {
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch employee conversations
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
      console.error('Failed to load employee conversations', e);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = async (convId: string) => {
    setSelectedConvId(convId);
    setIsLoadingMessages(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/v1/messages/conversations/${convId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConv(data.conversation);
        setMessages(data.messages || []);

        // Clear local unread badge
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCountEmployee: 0 } : c))
        );
      }
    } catch (e) {
      console.error('Error loading conversation history:', e);
      setErrorMsg('Failed to load conversation history');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId) return;
    if (!replyText.trim() && !replyFile) return;

    setIsReplying(true);
    setErrorMsg('');

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

        // Update conversation list locally
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
    } catch (e: any) {
      console.error('Error sending reply:', e);
      setErrorMsg(e.message || 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['Employee', 'Super Admin']}>
      <AdminLayout
        pageTitle="HR Messages & Communication"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Messages', href: '/employee/messages' },
        ]}
      >
        {/* Page Banner */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Private HR Messages</span>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="w-3 h-3" />
                Private & Secure
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Read private notices, policy updates, and communicate directly with HR Management
            </p>
          </div>
        </div>

        {/* Messaging Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-250px)] min-h-[500px]">
          {/* Left Sidebar: Threads */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inbox Threads</h3>
              <span className="text-[11px] font-semibold text-indigo-600">{conversations.length} Threads</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading inbox...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No HR Messages Yet</p>
                  <p className="mt-1 text-[11px] max-w-[200px] mx-auto">
                    When HR sends you a private message or notice, it will appear here.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
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
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        HR
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">HR Administration</h4>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-indigo-900 truncate mb-0.5">{conv.subject}</p>
                        <p className="text-[11px] text-slate-500 truncate">{conv.lastMessage}</p>
                      </div>

                      {(conv.unreadCountEmployee || 0) > 0 && (
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0 self-center" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat History & Reply */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            {selectedConv ? (
              <>
                {/* Header */}
                <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>HR Administration</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                        Official HR Channel
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200 font-medium">Subject: {selectedConv.subject}</p>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Loading thread...</span>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderRole?.toUpperCase() === 'EMPLOYEE';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-600">
                              {isMe ? 'You' : 'HR Admin'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                              isMe
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
                                      isMe
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

                {/* Reply Form */}
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
                      placeholder="Write your reply to HR..."
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
                          <span>Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
                <h3 className="font-bold text-slate-700 text-sm">Select HR Conversation</h3>
                <p className="text-xs text-slate-500 mt-1">Select a message thread from the left to read and reply.</p>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
