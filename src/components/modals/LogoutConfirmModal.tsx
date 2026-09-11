'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
      // Replace history state so back button cannot navigate back into protected pages
      window.history.pushState(null, '', '/login');
      router.replace('/login?logged_out=true');
    } catch {
      setIsLoggingOut(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-xs text-slate-800 animate-fade-in">
        <div className="flex items-center justify-between border-b pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-rose-600" />
            <span>Confirm Sign Out</span>
          </div>
          <button onClick={onClose} disabled={isLoggingOut} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-amber-50/70 p-3 text-amber-900 border border-amber-200/60">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Are you sure you want to sign out?</p>
            <p className="mt-0.5 text-[11px] text-amber-800">
              Your active session will be terminated and tokens revoked. Any unsaved data will be lost.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span>Yes, Logout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
