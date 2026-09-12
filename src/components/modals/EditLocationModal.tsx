'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { Location } from '@/types/admin';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
  onSave: (id: string, updated: Partial<Location>) => void;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  location,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    if (location) {
      setName(location.name || '');
      setCode(location.code || '');
      setCity(location.city || '');
      setStateName(location.state || '');
      setCountry(location.country || 'India');
      setAddress(location.address || '');
      setStatus(location.status || 'Active');
    }
  }, [location]);

  if (!isOpen || !location) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    onSave(location.id, {
      name: name.trim(),
      code: code.trim().toUpperCase() || city.substring(0, 3).toUpperCase(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim() || 'India',
      address: address.trim(),
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>Edit Location</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="font-bold text-slate-900">Location / Branch Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mumbai Tech Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">Code</label>
              <input
                type="text"
                placeholder="e.g. BOM"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white uppercase font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-900">State / Region</label>
              <input
                type="text"
                placeholder="e.g. Maharashtra"
                value={state}
                onChange={(e) => setStateName(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-900">Country</label>
              <input
                type="text"
                placeholder="e.g. India"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900">Office Address (Optional)</label>
            <textarea
              placeholder="Full office address details..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-900">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="mt-1 w-full rounded-xl border p-2.5 bg-slate-50 focus:border-emerald-500 focus:bg-white font-medium"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              Update Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
