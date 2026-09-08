export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface KpiMetric {
  id: string;
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  periodText: string;
  iconName: 'users' | 'user-check' | 'user-minus' | 'user-plus';
}

export interface AttendanceData {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  total: number;
}

export interface GrowthDataPoint {
  month: string;
  count: number;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  avatar: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  status: LeaveStatus;
}

export interface HolidayEvent {
  id: string;
  name: string;
  category: 'National Holiday' | 'Public Holiday' | 'Company Festival' | 'Mandatory Holiday';
  date: string;
  relativeLabel?: string;
  dayOfWeek: string;
}

export interface RecentActivityItem {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target?: string;
  timestamp: string;
  category: 'employee' | 'leave' | 'payroll' | 'policy';
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  isImportant?: boolean;
}
