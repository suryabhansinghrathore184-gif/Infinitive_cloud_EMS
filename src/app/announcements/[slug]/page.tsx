'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Megaphone, Calendar, ArrowLeft, Download, Share2, Tag, ChevronRight, CheckCircle2 } from 'lucide-react';
import { AnnouncementItem } from '@/types/dashboard';

export default function AnnouncementDetailPage({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<{ announcement: AnnouncementItem; related: AnnouncementItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/public/announcements/${params.slug}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setErrorMsg(json.message || 'Announcement not found.');
        }
      } catch (err) {
        setErrorMsg('Failed to load announcement detail.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [params.slug]);

  const announcement = data?.announcement;
  const related = data?.related || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="mx-auto max-w-4xl w-full flex-1 px-4 py-8 sm:px-6 space-y-6">
        {/* Back Link */}
        <Link
          href="/announcements"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Announcements
        </Link>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-3 text-xs text-slate-400 font-semibold">Loading announcement...</p>
          </div>
        ) : errorMsg || !announcement ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center text-xs text-slate-400">
            <Megaphone className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="mt-3 text-sm font-bold text-slate-200">Announcement Unavailable</h3>
            <p className="mt-1 text-slate-400">{errorMsg || 'The requested announcement is not available.'}</p>
            <Link
              href="/announcements"
              className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
            >
              Return to Announcements
            </Link>
          </div>
        ) : (
          <article className="space-y-6">
            {/* Header Metadata */}
            <div className="space-y-3 border-b border-slate-800 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  {announcement.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {announcement.date}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {announcement.title}
              </h1>

              {announcement.shortDescription && (
                <p className="text-sm font-medium text-slate-300 italic border-l-2 border-emerald-500 pl-3.5">
                  {announcement.shortDescription}
                </p>
              )}
            </div>

            {/* Featured Image */}
            {announcement.imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-slate-800 max-h-96">
                <img
                  src={announcement.imageUrl}
                  alt={announcement.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            {/* Announcement Body Content */}
            <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-line space-y-4">
              {announcement.content}
            </div>

            {/* File Attachment Download if available */}
            {announcement.fileId && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Official Document Attachment</span>
                </div>
                <a
                  href={`/api/v1/documents/${announcement.fileId}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  Download File
                </a>
              </div>
            )}

            {/* Related Announcements */}
            {related.length > 0 && (
              <div className="border-t border-slate-800 pt-8 space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Related Public Broadcasts</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/announcements/${rel.slug}`}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-emerald-500/40 transition block"
                    >
                      <span className="text-[10px] font-bold text-emerald-400">{rel.category}</span>
                      <h4 className="mt-1 text-xs font-bold text-white line-clamp-2">{rel.title}</h4>
                      <span className="mt-2 text-[10px] text-slate-500 block">{rel.date}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Enterprise Organization. Official Corporate Communication.</p>
      </footer>
    </div>
  );
}
