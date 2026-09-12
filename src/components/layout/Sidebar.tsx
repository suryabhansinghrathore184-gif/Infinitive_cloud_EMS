'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
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

interface NavSection {
  category: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    category: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    category: 'PEOPLE',
    items: [
      { name: 'Employees', href: '/admin/employees', icon: Users },
      { name: 'Organization', href: '/admin/organization', icon: Building2 },
    ],
  },
  {
    category: 'TIME',
    items: [
      { name: 'Attendance', href: '/admin/attendance', icon: Clock },
      { name: 'Leave', href: '/admin/leave', icon: CalendarDays, badge: '5' },
    ],
  },
  {
    category: 'FINANCE',
    items: [
      { name: 'Payroll', href: '/admin/payroll', icon: CreditCard },
    ],
  },
  {
    category: 'DEVELOPMENT',
    items: [
      { name: 'Performance', href: '/admin/performance', icon: TrendingUp },
      { name: 'Documents', href: '/admin/documents', icon: FileText },
    ],
  },
  {
    category: 'TALENT',
    items: [
      { name: 'Recruitment', href: '/admin/recruitment', icon: UserPlus },
    ],
  },
  {
    category: 'COMMUNICATION',
    items: [
      { name: 'Communication', href: '/admin/communication', icon: MessageSquare },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    category: 'INSIGHTS',
    items: [
      { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    category: 'SYSTEM',
    items: [
      { name: 'Helpdesk', href: '/admin/helpdesk', icon: HelpCircle },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
      { name: 'Integrations', href: '/admin/integrations', icon: Puzzle },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { unreadNotificationsCount } = useEmsStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [helpdeskCount, setHelpdeskCount] = useState<number | null>(null);
  const [apiUnreadNotifCount, setApiUnreadNotifCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      try {
        const [helpdeskRes, notifRes] = await Promise.all([
          fetch('/api/v1/hr-requests?limit=1'),
          fetch('/api/v1/notifications/unread-count'),
        ]);

        if (helpdeskRes.ok) {
          const data = await helpdeskRes.json();
          if (data.success && data.statusCounts) {
            const actionable =
              (data.statusCounts.open || 0) +
              (data.statusCounts.assigned || 0) +
              (data.statusCounts.inProgress || 0);
            if (isMounted) setHelpdeskCount(actionable);
          }
        }

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData.success && typeof notifData.unreadCount === 'number') {
            if (isMounted) setApiUnreadNotifCount(notifData.unreadCount);
          }
        }
      } catch {
        // Ignore background fetch errors
      }
    };

    fetchBadges();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const getDynamicBadge = (item: NavItem) => {
    if (item.name === 'Notifications') {
      const count = apiUnreadNotifCount !== null ? apiUnreadNotifCount : unreadNotificationsCount;
      if (count <= 0) return null;
      if (count > 99) return '99+';
      return String(count);
    }
    if (item.name === 'Helpdesk') {
      if (helpdeskCount === null || helpdeskCount <= 0) return null;
      if (helpdeskCount > 99) return '99+';
      return String(helpdeskCount);
    }
    return item.badge || null;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-950 text-slate-300 border-r border-slate-800/80 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Header Branding */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1">
                  <span className="text-base font-extrabold tracking-tight text-white">EMS</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">/ HRMS</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Enterprise HR SaaS</p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:flex"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((sec) => (
            <div key={sec.category} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {sec.category}
                </div>
              ) : (
                <div className="h-1 border-t border-slate-800/60 my-2"></div>
              )}

              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || (pathname === '/' && item.href === '/admin/dashboard');
                const badgeText = getDynamicBadge(item);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.name : undefined}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>

                    {!isCollapsed && badgeText && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-indigo-400 group-hover:bg-slate-700'
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}

                    {/* Tooltip on Collapsed Mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 z-50 hidden rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white shadow-xl group-hover:block whitespace-nowrap border border-slate-700">
                        {item.name}
                        {badgeText && (
                          <span className="ml-1.5 rounded-full bg-indigo-600 px-1.5 py-0.2 text-[9px] font-bold">
                            {badgeText}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Status Panel */}
        <div className="border-t border-slate-800/80 p-3">
          {!isCollapsed ? (
            <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>HR Master Panel</span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400">Enterprise Edition v2.0</p>
            </div>
          ) : (
            <div className="flex justify-center" title="Enterprise HR Active">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
