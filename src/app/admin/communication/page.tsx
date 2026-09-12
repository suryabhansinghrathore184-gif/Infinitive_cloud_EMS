'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AnnouncementItem } from '@/types/dashboard';

// Modals
import { CreateAnnouncementModal } from '@/components/modals/CreateAnnouncementModal';
import { PreviewAnnouncementModal } from '@/components/modals/PreviewAnnouncementModal';

export default function CommunicationPage() {
  const { state, setAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useEmsStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLIC' | 'INTERNAL' | 'DRAFT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Partial<AnnouncementItem> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  useEffect(() => {
    fetchLiveAnnouncements();
  }, []);

  const announcements = state.announcements || [];

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

  const handleToggleStatus = async (ann: AnnouncementItem, newStatus: 'Published' | 'Unpublished' | 'Archived') => {
    const updated = { ...ann, status: newStatus as any };
    try {
      await fetch(`/api/v1/announcements/${ann.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error(e);
    }
    updateAnnouncement(ann.id, { status: newStatus as any });
    showToast(`Announcement "${ann.title}" updated to ${newStatus}.`);
  };

  // Filtered List
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

  return (
    <AdminLayout
      pageTitle="Company Communication & Broadcasts"
      breadcrumbs={[{ label: 'Communication', href: '/admin/communication' }]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
            <span>Public Website ({announcements.filter((a) => a.visibility === 'Public Website' && a.status === 'Published').length})</span>
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
    </AdminLayout>
  );
}
