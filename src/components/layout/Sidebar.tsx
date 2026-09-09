'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  CreditCard,
  TrendingUp,
  FileText,
  UserPlus,
  MessageSquare,
  Bell,
  HelpCircle,
  BarChart3,
  Settings,
  ShieldAlert,
  Puzzle,
  X,
} from 'lucide-react';

import { useEmsStore } from '@/store/emsStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Employees', href: '/admin/employees', icon: Users },
  { name: 'Organization', href: '/admin/organization', icon: Building2 },
  { name: 'Attendance', href: '/admin/attendance', icon: Clock },
  { name: 'Leave', href: '/admin/leave', icon: CalendarDays, badge: '5' },
  { name: 'Payroll', href: '/admin/payroll', icon: CreditCard },
  { name: 'Performance', href: '/admin/performance', icon: TrendingUp },
  { name: 'Documents', href: '/admin/documents', icon: FileText },
  { name: 'Recruitment', href: '/admin/recruitment', icon: UserPlus },
  { name: 'Communication', href: '/admin/communication', icon: MessageSquare },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Helpdesk', href: '/admin/helpdesk', icon: HelpCircle, badge: '2' },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
  { name: 'Integrations', href: '/admin/integrations', icon: Puzzle },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { unreadNotificationsCount } = useEmsStore();

  const getDynamicBadge = (item: NavItem) => {
    if (item.name === 'Notifications') {
      if (unreadNotificationsCount <= 0) return null;
      if (unreadNotificationsCount > 99) return '99+';
      return String(unreadNotificationsCount);
    }
    return item.badge || null;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">EMS</span>
              <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-blue-400">/ HRMS</span>
              <p className="text-[10px] text-slate-400">Admin Control Panel</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Admin Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (pathname === '/' && item.href === '/admin/dashboard');

              const badgeText = getDynamicBadge(item);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {badgeText && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-blue-400 group-hover:bg-slate-700'
                      }`}
                    >
                      {badgeText}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-800/50 p-3 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              HR Panel: Active
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Restricted Enterprise Access</p>
          </div>
        </div>
      </aside>
    </>
  );
};
