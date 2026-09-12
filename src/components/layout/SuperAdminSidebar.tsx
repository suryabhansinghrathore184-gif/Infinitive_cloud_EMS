'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Users,
  ShieldCheck,
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
  Lock,
} from 'lucide-react';

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badgeKey?: 'unreadNotifications' | 'pendingLeaves' | 'openHelpdesk';
}

interface NavSection {
  category: string;
  items: NavItem[];
}

const superAdminNavSections: NavSection[] = [
  {
    category: 'EXECUTIVE',
    items: [
      { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    category: 'ORGANIZATION & STRUCTURE',
    items: [
      { name: 'Organizations', href: '/super-admin/organizations', icon: Building2 },
      { name: 'Org Hierarchy', href: '/super-admin/organization-structure', icon: FolderTree },
    ],
  },
  {
    category: 'USER & ACCESS MANAGEMENT',
    items: [
      { name: 'System Users', href: '/super-admin/users', icon: Users },
      { name: 'Roles & Matrix', href: '/super-admin/roles', icon: ShieldCheck },
    ],
  },
  {
    category: 'PEOPLE MANAGEMENT',
    items: [
      { name: 'Employees', href: '/super-admin/employees', icon: Users },
    ],
  },
  {
    category: 'SYSTEM MODULES',
    items: [
      { name: 'Attendance', href: '/admin/attendance', icon: Clock },
      { name: 'Leave Management', href: '/admin/leave', icon: CalendarDays, badgeKey: 'pendingLeaves' },
      { name: 'Payroll & Finance', href: '/admin/payroll', icon: CreditCard },
      { name: 'Performance', href: '/admin/performance', icon: TrendingUp },
      { name: 'Document Vault', href: '/admin/documents', icon: FileText },
      { name: 'Recruitment', href: '/admin/recruitment', icon: UserPlus },
      { name: 'Communication', href: '/admin/communication', icon: MessageSquare },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell, badgeKey: 'unreadNotifications' },
      { name: 'HR Helpdesk', href: '/admin/helpdesk', icon: HelpCircle, badgeKey: 'openHelpdesk' },
      { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    category: 'SECURITY & GOVERNANCE',
    items: [
      { name: 'Security Center', href: '/super-admin/security', icon: Lock },
      { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: ShieldAlert },
      { name: 'Integrations', href: '/admin/integrations', icon: Puzzle },
      { name: 'System Settings', href: '/super-admin/settings', icon: Settings },
    ],
  },
];

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [badges, setBadges] = useState<{ unreadNotifications: number; pendingLeaves: number; openHelpdesk: number }>({
    unreadNotifications: 0,
    pendingLeaves: 0,
    openHelpdesk: 0,
  });

  // Restore collapsed preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('super_admin_sidebar_collapsed');
      if (saved === 'true') setIsCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('super_admin_sidebar_collapsed', String(next));
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;
    const fetchBadges = async () => {
      try {
        const res = await fetch('/api/v1/layout/badges');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data && isMounted) {
            setBadges({
              unreadNotifications: result.data.unreadNotifications || 0,
              pendingLeaves: result.data.pendingLeaves || 0,
              openHelpdesk: result.data.openHelpdesk || 0,
            });
          }
        }
      } catch {}
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const renderBadge = (key?: 'unreadNotifications' | 'pendingLeaves' | 'openHelpdesk') => {
    if (!key) return null;
    const count = badges[key];
    if (!count || count <= 0) return null;
    return count > 99 ? '99+' : String(count);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
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
          <Link href="/super-admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 font-bold text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1">
                  <span className="text-base font-extrabold tracking-tight text-white">SUPER ADMIN</span>
                </div>
                <p className="text-[10px] text-amber-400 font-semibold tracking-wide uppercase">Global System Control</p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapse}
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
          {superAdminNavSections.map((sec) => (
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
                const isActive = pathname === item.href;
                const badgeText = renderBadge(item.badgeKey);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.name : undefined}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-600/40 font-bold'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                          isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>

                    {!isCollapsed && badgeText && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
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
            <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Super Admin</span>
                </div>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                  ROOT
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400 font-mono">Enterprise v2.0 Global</p>
            </div>
          ) : (
            <div className="flex justify-center" title="Super Admin Active">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
