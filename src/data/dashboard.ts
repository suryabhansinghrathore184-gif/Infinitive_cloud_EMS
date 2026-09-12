import {
  KpiMetric,
  AttendanceData,
  GrowthDataPoint,
  LeaveRequest,
  HolidayEvent,
  RecentActivityItem,
  AnnouncementItem
} from '@/types/dashboard';

export const mockUserData = {
  name: 'Admin',
  role: 'HR Administrator',
  email: 'admin@organization.com',
  avatar: '',
};

export const mockKpiMetrics: KpiMetric[] = [];

export const mockAttendanceData: AttendanceData = {
  present: 0,
  absent: 0,
  late: 0,
  onLeave: 0,
  total: 0,
};

export const mockGrowthData: GrowthDataPoint[] = [];

export const mockLeaveRequests: LeaveRequest[] = [];

export const mockHolidayEvents: HolidayEvent[] = [];

export const mockRecentActivities: RecentActivityItem[] = [];

export const mockAnnouncements: AnnouncementItem[] = [];
