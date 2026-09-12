'use client';

import React, { useState, useRef } from 'react';
import { Employee, EmploymentStatus, EmploymentType, ProfilePhotoMeta } from '@/types/admin';
import {
  X,
  UserPlus,
  ShieldAlert,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Camera,
  FileCheck,
} from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (emp: Omit<Employee, 'id'>) => { success: boolean; message: string };
  departments: string[];
  designations: string[];
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  departments,
  designations,
}) => {
  const [formData, setFormData] = useState({
    employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
    dateOfBirth: '1995-01-01',
    gender: 'Male',
    bloodGroup: 'O+',
    address: '',
    city: '',
    state: '',
    country: 'India',
    department: departments[0] || 'Engineering & IT',
    designation: designations[0] || 'Senior Software Engineer',
    manager: 'Rajesh K.',
    location: 'Mumbai Tech Hub',
    employmentType: 'Full-time' as EmploymentType,
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active' as EmploymentStatus,
    shift: 'Standard (09:00 - 18:00)',
    grade: 'Grade A3',
    emergencyContactName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',
    emergencyAddress: '',
    bankName: 'HDFC Bank',
    accountNumber: '',
    ifscCode: '',
    accountHolder: '',
    panNumber: '',
    aadhaarNo: '',
    passportNo: '',
  });

  // Document photo extraction state
  const docInputRef = useRef<HTMLInputElement>(null);
  const manualPhotoRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState('Aadhaar Card');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [extractedPhotoUri, setExtractedPhotoUri] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<ProfilePhotoMeta | null>(null);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate initials for avatar fallback (e.g. Suryabhan Rathore -> SR)
  const getInitials = () => {
    const f = formData.firstName.trim().charAt(0).toUpperCase();
    const l = formData.lastName.trim().charAt(0).toUpperCase();
    return f && l ? `${f}${l}` : f || 'EMP';
  };

  // Handle Identity Document Upload & Automatic Photo Extraction
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractionError(null);
    setUploadedDocName(file.name);

    try {
      const apiFormData = new FormData();
      apiFormData.append('file', file);
      apiFormData.append('documentType', documentType);

      const res = await fetch('/api/v1/documents/extract-photo', {
        method: 'POST',
        body: apiFormData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setExtractionError(
          data.message || "Couldn't automatically detect a profile photo from this document."
        );
        return;
      }

      if (data.photoCandidates && data.photoCandidates.length > 0) {
        setCandidates(data.photoCandidates);
        const primary = data.photoCandidates[0];
        setSelectedCandidateId(primary.id);
        setExtractedPhotoUri(primary.previewUrl);

        // Upload extracted photo binary to GridFS for permanent storage
        await saveExtractedPhotoToGridFS(primary.previewUrl, file.name, 'document-extraction');
      }
    } catch (err: any) {
      console.error('Error extracting photo from document:', err);
      setExtractionError('Extraction service error. Please try uploading a different document.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Upload photo preview data to MongoDB GridFS & update form state
  const saveExtractedPhotoToGridFS = async (
    photoUri: string,
    docName: string,
    source: 'document-extraction' | 'manual-upload'
  ) => {
    try {
      // Convert base64 URI to Blob/File for GridFS upload endpoint
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const file = new File([blob], `extracted_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const gridFsFormData = new FormData();
      gridFsFormData.append('file', file);

      const res = await fetch('/api/v1/admin/profile/photo', {
        method: 'POST',
        body: gridFsFormData,
      });

      const gridFsData = await res.json();

      if (res.ok && gridFsData.success && gridFsData.photoUrl) {
        setFormData((prev) => ({ ...prev, avatar: gridFsData.photoUrl }));
        setPhotoMeta({
          fileId: gridFsData.fileId,
          mimeType: 'image/jpeg',
          fileName: docName,
          source,
          uploadedAt: new Date().toISOString(),
          documentType,
        });
      } else {
        // Fallback to base64 preview URI
        setFormData((prev) => ({ ...prev, avatar: photoUri }));
      }
    } catch (err) {
      console.warn('GridFS upload warning, using local photo preview:', err);
      setFormData((prev) => ({ ...prev, avatar: photoUri }));
    }
  };

  // Handle Manual Profile Photo Upload from computer
  const handleManualPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const uri = event.target?.result as string;
      setExtractedPhotoUri(uri);
      setExtractionError(null);
      await saveExtractedPhotoToGridFS(uri, file.name, 'manual-upload');
    };
    reader.readAsDataURL(file);
  };

  // Switch candidate photo if multiple detected
  const handleSelectCandidate = async (candidate: any) => {
    setSelectedCandidateId(candidate.id);
    setExtractedPhotoUri(candidate.previewUrl);
    await saveExtractedPhotoToGridFS(candidate.previewUrl, uploadedDocName || 'identity-doc', 'document-extraction');
  };

  // Clear photo
  const handleRemovePhoto = () => {
    setExtractedPhotoUri(null);
    setCandidates([]);
    setSelectedCandidateId(null);
    setPhotoMeta(null);
    setFormData((prev) => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validation
    if (!formData.employeeId.trim()) {
      setErrorMessage('Employee ID is required.');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('First Name and Last Name are required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Valid email address is required.');
      return;
    }
    if (!formData.joiningDate) {
      setErrorMessage('Joining Date is required.');
      return;
    }

    const payload = {
      ...formData,
      profilePhoto: photoMeta || undefined,
    };

    const res = onSave(payload);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      onClose();
    }
  };

  const currentAvatarUrl = extractedPhotoUri || formData.avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl my-8 overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in text-xs text-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold">Add New Employee Master Record</h3>
              <p className="text-[11px] text-slate-400">
                Register employee details & automatically extract photo from identity document
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 bg-rose-50 p-3 text-xs font-semibold text-rose-700 border-b border-rose-200">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={docInputRef}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleDocumentUpload}
            className="hidden"
          />
          <input
            type="file"
            ref={manualPhotoRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleManualPhotoUpload}
            className="hidden"
          />

          {/* SECTION 1: IDENTITY DOCUMENT & AUTOMATIC PHOTO EXTRACTION */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Automatic Photo Extraction from Identity Document
                </h4>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 border border-indigo-200">
                AI Powered
              </span>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              Upload an official identity document (Aadhaar, Passport, PAN Card, Driving License, ID Card). The system automatically detects, crops, and processes the employee&apos;s portrait photograph for MongoDB GridFS storage.
            </p>

            {/* Document Type Selector & Upload Trigger */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-48">
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-900 focus:border-indigo-500"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Employee ID Card">Employee ID Card</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isExtracting}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all w-full sm:w-auto justify-center disabled:opacity-50"
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>
                  {isExtracting ? 'Analyzing Document...' : 'Upload & Extract Photo from Document'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => manualPhotoRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all w-full sm:w-auto justify-center"
              >
                <Camera className="h-3.5 w-3.5 text-slate-500" />
                <span>Manual Upload</span>
              </button>
            </div>

            {/* Extraction Processing State */}
            {isExtracting && (
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 border border-indigo-100 shadow-2xs">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                <div>
                  <p className="font-bold text-slate-900">Analyzing document for portrait photograph...</p>
                  <p className="text-[11px] text-slate-500">Detecting face bounding box & cropping portrait</p>
                </div>
              </div>
            )}

            {/* Extraction Error Fallback */}
            {extractionError && (
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{extractionError}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => manualPhotoRef.current?.click()}
                    className="rounded-lg bg-amber-600 px-3 py-1 font-bold text-white hover:bg-amber-700 text-[11px]"
                  >
                    Upload Profile Photo Manually
                  </button>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1 font-semibold text-amber-800 hover:bg-amber-100 text-[11px]"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Photo Preview & Confirmation Card */}
            {currentAvatarUrl ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
                {/* Extracted Photo Image Preview */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-4 ring-emerald-500/20 shadow-md">
                  <img
                    src={currentAvatarUrl}
                    alt="Extracted Profile"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {photoMeta?.source === 'document-extraction'
                        ? 'Photo detected from identity document'
                        : 'Uploaded profile photo'}
                    </span>
                  </div>

                  {uploadedDocName && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Source File: <strong>{uploadedDocName}</strong> ({documentType})
                    </p>
                  )}

                  {/* Multiple Candidate Selection */}
                  {candidates.length > 1 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-700">Select Portrait Candidate:</span>
                      {candidates.map((cand, idx) => (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => handleSelectCandidate(cand)}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                            selectedCandidateId === cand.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Photo {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Photo Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100 text-[11px]"
                    >
                      <RefreshCw className="h-3 w-3" /> Re-extract
                    </button>
                    <button
                      type="button"
                      onClick={() => manualPhotoRef.current?.click()}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100 text-[11px]"
                    >
                      <Camera className="h-3 w-3" /> Upload Different
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 hover:bg-rose-100 text-[11px]"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Professional Initials Avatar Preview Fallback */
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-extrabold text-white text-lg ring-4 ring-indigo-500/20 shadow-md">
                  {getInitials()}
                </div>
                <div>
                  <p className="font-bold text-slate-900">Professional Initials Avatar Preview ({getInitials()})</p>
                  <p className="text-[11px] text-slate-500">
                    Will be displayed until an identity document or profile photo is uploaded.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: EMPLOYEE DETAILS FORM */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="font-bold text-slate-900">Employee ID *</label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-bold focus:border-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-900">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-semibold focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-900">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 font-semibold focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="font-bold text-slate-900">Official Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-900">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-900">Joining Date *</label>
                <input
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="font-bold text-slate-900">Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold focus:border-indigo-500"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-900">Designation *</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-900">Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:border-indigo-500 font-medium"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="font-bold text-slate-900">Work Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-900">Reporting Manager</label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-900">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 bg-white focus:border-indigo-500 font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Probation">Probation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Save & Register Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
