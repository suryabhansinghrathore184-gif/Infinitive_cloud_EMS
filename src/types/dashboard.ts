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
  category: 'National Holiday' | 'Public Holiday' | 'Company Festival' | 'Mandatory Holiday' | 'Optional Holiday' | 'Company Event';
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
  organizationId?: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  content: string;
  date: string;
  category: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  imageUrl?: string;
  fileId?: string;
  visibility?: 'Internal Only' | 'Public Website';
  status?: 'Draft' | 'Published' | 'Scheduled' | 'Unpublished' | 'Archived';
  publishAt?: string;
  expiresAt?: string;
  isImportant?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
