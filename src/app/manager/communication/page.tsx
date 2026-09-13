'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Send, Megaphone } from 'lucide-react';

export default function ManagerCommunicationPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/public/announcements');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnnouncements(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Communication</h1>
          <p className="text-sm text-slate-500 mt-1">Broadcast team announcements and check organization updates.</p>
        </div>
        <button
          onClick={fetchAnnouncements}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-indigo-600" />
          <span>Organization Announcements</span>
        </h2>
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No active announcements.</div>
        ) : (
          <div className="mt-4 space-y-4">
            {announcements.map((item) => (
              <div key={item._id || item.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-600">{item.content || item.summary}</p>
                <span className="mt-2 block text-[10px] font-mono text-slate-400">{item.createdAt || 'Recent'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
