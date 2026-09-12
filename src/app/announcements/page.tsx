'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Megaphone, Search, Calendar, Tag, ArrowRight, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { AnnouncementItem } from '@/types/dashboard';

export default function PublicAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchPublicAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/public/announcements');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAnnouncements(data.data);
      }
    } catch (err) {
      console.error('Failed to load public announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicAnnouncements();
  }, []);

  const categories = ['ALL', 'Company News', 'Policy Update', 'Holiday Notice', 'IT & Security', 'Events & Celebrations', 'Hiring & Growth'];

  const filteredAnnouncements = announcements.filter((a) => {
    const matchCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchSearch =
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const featured = filteredAnnouncements.find((a) => a.priority === 'High' || a.priority === 'Urgent') || filteredAnnouncements[0];
  const regularCards = featured ? filteredAnnouncements.filter((a) => a.id !== featured.id) : filteredAnnouncements;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <PublicHeader />

      {/* Hero Header Section */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Megaphone className="h-4 w-4" /> Official Company Broadcasts
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl text-white tracking-tight">
            Company Announcements & Media News
          </h1>
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed">
            Stay updated with official organizational broadcasts, press releases, holiday schedules, corporate events, and public notices.
          </p>

          {/* Search & Category Filter */}
          <div className="pt-4 mx-auto max-w-3xl space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search announcements, news topics, guidelines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 py-3 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none shadow-xl"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 font-bold transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Content Body */}
      <main className="mx-auto max-w-6xl w-full flex-1 px-4 py-10 sm:px-6 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-3 text-xs text-slate-400 font-semibold">Loading official announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
            <Megaphone className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="mt-3 text-sm font-bold text-slate-200">No public announcements available</h3>
            <p className="mt-1 max-w-xs mx-auto text-slate-400">
              There are currently no public announcements matching your filter. Please check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Announcement Banner */}
            {featured && (
              <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 shadow-2xl transition hover:border-emerald-500/50">
                <div className="grid grid-cols-1 md:grid-cols-12">
                  {featured.imageUrl && (
                    <div className="md:col-span-5 relative h-56 md:h-full">
                      <img
                        src={featured.imageUrl}
                        alt={featured.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className={`p-6 sm:p-8 flex flex-col justify-between ${featured.imageUrl ? 'md:col-span-7' : 'md:col-span-12'}`}>
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-extrabold text-emerald-400 border border-emerald-500/30 text-[10px]">
                          <Sparkles className="h-3 w-3" /> FEATURED BROADCAST
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {featured.category}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl leading-snug">
                        {featured.title}
                      </h2>
                      <p className="mt-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                        {featured.shortDescription || featured.content}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {featured.date}
                      </span>
                      <Link
                        href={`/announcements/${featured.slug}`}
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition"
                      >
                        Read Full Announcement <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid of Announcements */}
            {regularCards.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Recent Notices & News ({regularCards.length})</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {regularCards.map((ann) => (
                    <div
                      key={ann.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
                    >
                      <div>
                        {ann.imageUrl && (
                          <div className="mb-3 overflow-hidden rounded-xl h-40 border border-slate-800">
                            <img
                              src={ann.imageUrl}
                              alt={ann.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/20 text-[10px]">
                            {ann.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{ann.date}</span>
                        </div>

                        <h4 className="mt-2.5 text-sm font-bold text-white line-clamp-2">{ann.title}</h4>
                        <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {ann.shortDescription || ann.content}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-800 pt-3 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500">Official Notice</span>
                        <Link
                          href={`/announcements/${ann.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                        >
                          Read More <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Enterprise Organization. Official Corporate Announcement Portal.</p>
      </footer>
    </div>
  );
}
