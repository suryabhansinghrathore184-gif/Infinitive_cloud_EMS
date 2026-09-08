'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { mockUserData } from '@/data/dashboard';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open Sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="hidden text-xs text-slate-500 sm:block">Overview of HR operations & organization activity</p>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden max-w-md flex-1 px-8 md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, departments, requests..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-12 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Mobile Search Icon Button */}
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Help Icon */}
        <button
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="HR Support & Documentation"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
            </span>
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">3 New</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                <div className="p-3 hover:bg-slate-50">
                  <p className="font-medium text-slate-800">Leave Request Approved</p>
                  <p className="text-slate-500">Rajesh approved Sneha&apos;s sick leave request.</p>
                  <span className="mt-1 block text-[10px] text-slate-400">10m ago</span>
                </div>
                <div className="p-3 hover:bg-slate-50">
                  <p className="font-medium text-slate-800">New Employee Joined</p>
                  <p className="text-slate-500">Ananya Roy onboarded to Engineering department.</p>
                  <span className="mt-1 block text-[10px] text-slate-400">1h ago</span>
                </div>
                <div className="p-3 hover:bg-slate-50">
                  <p className="font-medium text-slate-800">Attendance Report Ready</p>
                  <p className="text-slate-500">Monthly attendance summary generated.</p>
                  <span className="mt-1 block text-[10px] text-slate-400">3h ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-100"
          >
            {/* Avatar */}
            <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-blue-500/30">
              {/* eslint-disable-next-html-loader */}
              <img
                src={mockUserData.avatar}
                alt={mockUserData.name}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="hidden text-left sm:block">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-slate-900">{mockUserData.name}</span>
                <ShieldCheck className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-slate-500">{mockUserData.role}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-semibold text-slate-900">{mockUserData.name}</p>
                <p className="text-[11px] text-slate-500">{mockUserData.email}</p>
              </div>
              <div className="py-1 text-xs text-slate-700">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Account Settings</span>
                </button>
              </div>
              <div className="border-t border-slate-100 pt-1 text-xs text-rose-600">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
