'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlus, Sparkles } from 'lucide-react';

interface AddNewAccountCardProps {
  onOpenModal?: () => void;
  userRole?: string;
}

export const AddNewAccountCard: React.FC<AddNewAccountCardProps> = ({
  onOpenModal,
  userRole = 'ADMIN',
}) => {
  // Access Control check: Only SUPER_ADMIN, ADMIN, HR can see this card
  const isAuthorized = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(userRole.toUpperCase());

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 p-6 shadow-xs transition-all duration-200 hover:border-indigo-200 hover:shadow-md">
      {/* Decorative Accent Ribbon */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-4 ring-indigo-50">
            <UserPlus className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Add New Account</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/80">
                <Sparkles className="h-3 w-3 text-indigo-600" /> Secure Email OTP
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
              Create a secure user account and send email verification to the user.
            </p>
            <p className="text-[11px] text-slate-500 font-medium pt-0.5">
              Create employee, manager, HR or admin accounts with secure email verification.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
          {onOpenModal ? (
            <button
              type="button"
              onClick={onOpenModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New Account</span>
            </button>
          ) : (
            <Link
              href="/admin/accounts/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New Account</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
