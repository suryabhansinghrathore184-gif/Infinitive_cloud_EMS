'use client';

import React, { useState, useEffect } from 'react';
import { X, Megaphone, Eye, Globe, Lock, Save, Send } from 'lucide-react';
import { AnnouncementItem } from '@/types/dashboard';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ann: Partial<AnnouncementItem>) => void;
  onPreview?: (ann: Partial<AnnouncementItem>) => void;
  initialData?: AnnouncementItem | null;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onPreview,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Company News');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [visibility, setVisibility] = useState<'Internal Only' | 'Public Website'>('Internal Only');
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Archived'>('Published');
  const [imageUrl, setImageUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSlug(initialData.slug || '');
      setShortDescription(initialData.shortDescription || '');
      setContent(initialData.content || '');
      setCategory(initialData.category || 'Company News');
      setPriority((initialData.priority as any) || 'Medium');
      setVisibility(initialData.visibility || 'Internal Only');
      setStatus(initialData.status === 'Draft' ? 'Draft' : initialData.status === 'Archived' ? 'Archived' : 'Published');
      setImageUrl(initialData.imageUrl || '');
      setExpiresAt(initialData.expiresAt ? initialData.expiresAt.split('T')[0] : '');
    } else {
      setTitle('');
      setSlug('');
      setShortDescription('');
      setContent('');
      setCategory('Company News');
      setPriority('Medium');
      setVisibility('Internal Only');
      setStatus('Published');
      setImageUrl('');
      setExpiresAt('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const getPayload = (targetStatus: 'Draft' | 'Published' | 'Archived'): Partial<AnnouncementItem> => {
    return {
      id: initialData?.id,
      title: title.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      shortDescription: shortDescription.trim() || content.trim().slice(0, 160),
      content: content.trim(),
      category,
      priority,
      visibility,
      status: targetStatus,
      imageUrl: imageUrl.trim(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    };
  };

  const handleSubmit = (e: React.FormEvent, targetStatus: 'Draft' | 'Published' | 'Archived' = 'Published') => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Announcement Title and Body Content are required.');
      return;
    }
    const payload = getPayload(targetStatus);
    onSave(payload);
    onClose();
  };

  const handlePreviewClick = () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill Title and Content before launching preview.');
      return;
    }
    if (onPreview) {
      onPreview(getPayload(status));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl text-xs text-slate-800 animate-fade-in max-h-[90vh] flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Megaphone className="h-4 w-4" />
            </div>
            <span>{initialData ? 'Edit Announcement' : 'Create & Publish Announcement'}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form id="announcement-form" onSubmit={(e) => handleSubmit(e, status)} className="my-4 flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="font-bold text-slate-900">Announcement Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Company Offsite & Strategy Summit 2026"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Visibility Setting *</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white"
              >
                <option value="Internal Only">Internal Only (Employees & HR)</option>
                <option value="Public Website">Public Website (Visible to Public)</option>
              </select>
              <p className="mt-1 text-[10px] text-slate-400">
                {visibility === 'Public Website'
                  ? 'Will appear on the public company website (/announcements)'
                  : 'Visible strictly inside internal HR employee portal'}
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-900">SEO URL Slug</label>
              <input
                type="text"
                placeholder="e.g. annual-company-offsite-2026"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-mono text-[11px] text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-900">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
              >
                <option value="Company News">Company News</option>
                <option value="Policy Update">Policy Update</option>
                <option value="Holiday Notice">Holiday Notice</option>
                <option value="IT & Security">IT & Security</option>
                <option value="Events & Celebrations">Events & Celebrations</option>
                <option value="Hiring & Growth">Hiring & Growth</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent / Critical</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Short Summary / Tagline</label>
            <input
              type="text"
              placeholder="Brief 1-line description displayed on announcement cards..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Featured Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Full Announcement Body Content *</label>
            <textarea
              required
              rows={5}
              placeholder="Write comprehensive details, agendas, guidelines, or announcements..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </form>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between border-t pt-3">
          <button
            type="button"
            onClick={handlePreviewClick}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-100"
          >
            <Eye className="h-4 w-4 text-emerald-600" />
            <span>Preview on Website</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'Draft')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Save className="h-3.5 w-3.5 text-amber-600" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'Published')}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-md hover:bg-emerald-700"
            >
              <Send className="h-3.5 w-3.5 fill-white" />
              <span>{initialData ? 'Update & Publish' : 'Publish Announcement'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
