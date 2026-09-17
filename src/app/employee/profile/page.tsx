'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  RefreshCw,
  Calendar,
  MapPin,
  Briefcase,
  Camera,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  MessageSquare,
  Sparkles,
  Upload,
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const { user } = useAuthStore();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Photo state (GridFS)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    personalEmail: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    emergencyContact: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch('/api/v1/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setProfileData(data.user);
        } else {
          setProfileData(user);
        }
      } else {
        setProfileData(user);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setIsError(true);
      setProfileData(user);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Derived user details
  const activeUser = profileData || user;
  const fullName = activeUser?.name || 'Employee';
  const photoUrl = activeUser?.photoUrl || activeUser?.avatar;

  // Open Edit Modal with current values
  const handleOpenEditModal = () => {
    setEditForm({
      name: activeUser?.name || '',
      phone: activeUser?.phone || activeUser?.mobile || '',
      personalEmail: activeUser?.personalEmail || '',
      address: activeUser?.address || '',
      city: activeUser?.city || '',
      state: activeUser?.state || '',
      postalCode: activeUser?.postalCode || '',
      emergencyContact: activeUser?.emergencyContact || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Profile Edit Form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const res = await fetch('/api/v1/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editForm.name,
          phone: editForm.phone,
          personalEmail: editForm.personalEmail,
          address: editForm.address,
          city: editForm.city,
          state: editForm.state,
          postalCode: editForm.postalCode,
          emergencyContact: editForm.emergencyContact,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Profile updated successfully!');
        setIsEditModalOpen(false);
        fetchProfile();
      } else {
        showToast(data.message || 'Failed to update profile.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error communicating with server.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Photo Upload to GridFS
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds maximum 5MB limit.', 'error');
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      showToast('Invalid file extension. Only .jpg, .jpeg, .png, and .webp supported.', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/settings/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        showToast('Profile photo updated in GridFS storage!');
        fetchProfile();
      } else {
        showToast(data.message || 'Photo upload failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Photo Removal from GridFS
  const handleRemovePhoto = async () => {
    setIsDeletingPhoto(true);
    try {
      const res = await fetch('/api/v1/settings/profile/photo', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        showToast('Profile photo removed from GridFS.');
        setShowDeletePhotoModal(false);
        fetchProfile();
      } else {
        showToast(data.message || 'Failed to remove photo.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error removing photo.', 'error');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Profile"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'My Profile', href: '/employee/profile' },
        ]}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-white shadow-2xl animate-fade-in ${
              toastType === 'success' ? 'bg-slate-900 border border-emerald-500/40' : 'bg-rose-950 border border-rose-500/40'
            }`}
          >
            {toastType === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950">My Profile</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                View and manage your personal employee information.
              </p>
            </div>
            <button
              onClick={fetchProfile}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Profile</span>
            </button>
          </div>

          {/* Global Error Alert */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Unable to load your profile. Please check your connection.</span>
              </div>
              <button
                onClick={fetchProfile}
                className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Pulse Skeleton Loading State */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-32 w-full rounded-2xl bg-slate-200/80"></div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="h-64 rounded-2xl bg-slate-200/80"></div>
                <div className="h-64 rounded-2xl bg-slate-200/80"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  {/* Avatar & Photo Action */}
                  <div className="relative group">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-extrabold text-white shadow-md shadow-indigo-600/20 overflow-hidden border-2 border-indigo-100">
                      {photoUrl ? (
                        <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" />
                      ) : (
                        (fullName || 'E').charAt(0).toUpperCase()
                      )}

                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-xs">
                          <RefreshCw className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Change Photo Overlay Button */}
                    <label
                      title="Upload new photo to GridFS"
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-900 text-white shadow-md hover:bg-indigo-600 transition-all border-2 border-white"
                    >
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Employee Details */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-extrabold text-slate-950">{fullName}</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3" /> {activeUser?.status || 'Active Employee'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-indigo-600">
                      {activeUser?.designation || 'Staff Member'} <span className="text-slate-400">•</span> <span className="text-slate-600">{activeUser?.department || 'General'}</span>
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs pt-1">
                      <span className="rounded-full bg-slate-100 px-3 py-0.5 font-mono font-bold text-slate-700 border border-slate-200">
                        ID: {activeUser?.employeeId || '--'}
                      </span>
                      {photoUrl && (
                        <button
                          onClick={() => setShowDeletePhotoModal(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Profile Action */}
                <button
                  onClick={handleOpenEditModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 transition-all cursor-pointer shrink-0"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Personal Information Card */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                      <User className="h-4 w-4 text-indigo-600" />
                      <span>Personal Information</span>
                    </h3>

                    <div className="space-y-3 text-xs font-medium text-slate-700">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Full Name:</span>
                        <span className="font-bold text-slate-900">{fullName}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Work Email:</span>
                        <span className="font-bold text-slate-900">{activeUser?.email || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Phone Number:</span>
                        <span className="font-bold text-slate-900">{activeUser?.phone || activeUser?.mobile || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Personal Email:</span>
                        <span className="font-bold text-slate-900">{activeUser?.personalEmail || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Date of Birth:</span>
                        <span className="font-bold text-slate-900">{activeUser?.dob || activeUser?.dateOfBirth || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Residential Address:</span>
                        <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{activeUser?.address || 'Address not provided'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">City / State / Zip:</span>
                        <span className="font-bold text-slate-900">
                          {activeUser?.city || activeUser?.state
                            ? `${activeUser.city || ''} ${activeUser.state || ''} ${activeUser.postalCode || ''}`.trim()
                            : 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Emergency Contact:</span>
                        <span className="font-bold text-indigo-600">{activeUser?.emergencyContact || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Manager Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                      <Briefcase className="h-4 w-4 text-indigo-600" />
                      <span>Reporting Manager</span>
                    </h3>

                    {activeUser?.managerName || activeUser?.reportingToName ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm">
                            {(activeUser.managerName || activeUser.reportingToName).charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{activeUser.managerName || activeUser.reportingToName}</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Department Manager</p>
                          </div>
                        </div>

                        <Link
                          href="/employee/messages"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Contact</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-slate-400 italic">No manager assigned</div>
                    )}
                  </div>
                </div>

                {/* Employment Information & Security */}
                <div className="space-y-4">
                  {/* Employment Details */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      <span>Employment Information</span>
                    </h3>

                    <div className="space-y-3 text-xs font-medium text-slate-700">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Employee ID:</span>
                        <span className="font-bold text-slate-900 font-mono">{activeUser?.employeeId || '--'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Department:</span>
                        <span className="font-bold text-slate-900">{activeUser?.department || 'General'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Designation:</span>
                        <span className="font-bold text-slate-900">{activeUser?.designation || 'Staff Member'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Employment Status:</span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          {activeUser?.status || 'Active'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">System Role:</span>
                        <span className="font-bold text-indigo-600 font-mono">{activeUser?.role || 'EMPLOYEE'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-sans">Joining Date:</span>
                        <span className="font-bold text-slate-900">
                          {activeUser?.joiningDate || activeUser?.createdAt
                            ? new Date(activeUser.joiningDate || activeUser.createdAt).toLocaleDateString()
                            : 'Not provided'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Organization ID:</span>
                        <span className="font-bold text-slate-900 font-mono">{activeUser?.organizationId || '--'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Security Summary */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                      <Lock className="h-4 w-4 text-indigo-600" />
                      <span>Account Security</span>
                    </h3>

                    <div className="space-y-2 text-xs font-medium text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Authentication Status:</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Session Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email Verification:</span>
                        <span className="font-bold text-slate-800">Verified</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href="/employee/settings"
                        className="inline-flex items-center justify-between w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <span>Security Settings</span>
                        <span className="text-indigo-600 font-extrabold">Change Password →</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-indigo-600" />
                    <span>Edit Personal Profile</span>
                  </h3>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-800">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800">Personal Email</label>
                      <input
                        type="email"
                        placeholder="personal@domain.com"
                        value={editForm.personalEmail}
                        onChange={(e) => setEditForm({ ...editForm, personalEmail: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Residential Address</label>
                    <input
                      type="text"
                      placeholder="Street address..."
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-800">City</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800">State</label>
                      <input
                        type="text"
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800">Postal Code</label>
                      <input
                        type="text"
                        value={editForm.postalCode}
                        onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800">Emergency Contact</label>
                    <input
                      type="text"
                      placeholder="Contact name & phone..."
                      value={editForm.emergencyContact}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingProfile ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Photo Confirmation Modal */}
          {showDeletePhotoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  <span>Remove Profile Photo</span>
                </div>

                <p className="text-slate-600">
                  Are you sure you want to remove your profile photo from MongoDB GridFS storage?
                </p>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    disabled={isDeletingPhoto}
                    onClick={() => setShowDeletePhotoModal(false)}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Keep Photo
                  </button>
                  <button
                    disabled={isDeletingPhoto}
                    onClick={handleRemovePhoto}
                    className="rounded-xl bg-rose-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
                  >
                    {isDeletingPhoto ? 'Removing...' : 'Confirm Remove'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
