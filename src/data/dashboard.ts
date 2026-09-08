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
  email: 'admin@enterprise-hrms.com',
  // avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
};

export const mockKpiMetrics: KpiMetric[] = [
  {
    id: 'total-employees',
    title: 'Total Employees',
    value: '1,248',
    change: '+8.2%',
    isPositive: true,
    periodText: 'vs last month',
    iconName: 'users',
  },
  {
    id: 'active-employees',
    title: 'Active Employees',
    value: '1,192',
    change: '+2.4%',
    isPositive: true,
    periodText: 'vs last month',
    iconName: 'user-check',
  },
  {
    id: 'on-leave',
    title: 'On Leave',
    value: '36',
    change: '-1.5%',
    isPositive: true,
    periodText: 'vs last month',
    iconName: 'user-minus',
  },
  {
    id: 'new-employees',
    title: 'New Employees',
    value: '20',
    change: '+12.0%',
    isPositive: true,
    periodText: 'vs last month',
    iconName: 'user-plus',
  },
];

export const mockAttendanceData: AttendanceData = {
  present: 1086,
  absent: 72,
  late: 54,
  onLeave: 36,
  total: 1248,
};

export const mockGrowthData: GrowthDataPoint[] = [
  { month: 'January', count: 1120 },
  { month: 'February', count: 1150 },
  { month: 'March', count: 1180 },
  { month: 'April', count: 1205 },
  { month: 'May', count: 1225 },
  { month: 'June', count: 1248 },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'LR-101',
    employeeName: 'Aarav Sharma',
    employeeId: 'EMP1042',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    leaveType: 'Casual Leave',
    fromDate: '12 Sep 2026',
    toDate: '14 Sep 2026',
    totalDays: 3,
    status: 'Pending',
  },
  {
    id: 'LR-102',
    employeeName: 'Sneha Kapur',
    employeeId: 'EMP1089',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    leaveType: 'Sick Leave',
    fromDate: '09 Sep 2026',
    toDate: '10 Sep 2026',
    totalDays: 2,
    status: 'Approved',
  },
  {
    id: 'LR-103',
    employeeName: 'Rohan Verma',
    employeeId: 'EMP1015',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    leaveType: 'Earned Leave',
    fromDate: '20 Sep 2026',
    toDate: '25 Sep 2026',
    totalDays: 6,
    status: 'Pending',
  },
  {
    id: 'LR-104',
    employeeName: 'Ananya Roy',
    employeeId: 'EMP1104',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    leaveType: 'Unpaid Leave',
    fromDate: '05 Sep 2026',
    toDate: '05 Sep 2026',
    totalDays: 1,
    status: 'Rejected',
  },
  {
    id: 'LR-105',
    employeeName: 'Vikram Malhotra',
    employeeId: 'EMP1033',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    leaveType: 'Casual Leave',
    fromDate: '18 Sep 2026',
    toDate: '19 Sep 2026',
    totalDays: 2,
    status: 'Pending',
  },
];

export const mockHolidayEvents: HolidayEvent[] = [
  {
    id: 'hol-1',
    name: 'Ganesh Chaturthi',
    category: 'Public Holiday',
    date: '14 sep 2026',
    dayOfWeek: 'Thursday',
    relativeLabel: 'Upcoming',
  },
  {
    id: 'hol-2',
    name: 'Onam',
    category: 'Company Festival',
    date: '26 Aug 2026',
    dayOfWeek: 'Wednesday',
    relativeLabel: 'Upcoming',
  },
  {
    id: 'hol-3',
    name: 'Gandhi Jayanti',
    category: 'National Holiday',
    date: '02 Oct 2026',
    dayOfWeek: 'Friday',
    relativeLabel: 'Mandatory Off',
  },
  {
    id: 'hol-4',
    name: 'Diwali',
    category: 'Company Festival',
    date: '08 Nov 2026',
    dayOfWeek: 'Sunday',
    relativeLabel: 'Festival',
  },
  {
    id: 'hol-5',
    name: 'Christmas',
    category: 'Public Holiday',
    date: '25 Dec 2026',
    dayOfWeek: 'Friday',
    relativeLabel: 'Year End',
  },
];

export const mockRecentActivities: RecentActivityItem[] = [
  {
    id: 'act-1',
    user: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    action: 'added a new employee Ananya Roy (EMP1104)',
    timestamp: '10 mins ago',
    category: 'employee',
  },
  {
    id: 'act-2',
    user: 'Employee EMP1025',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    action: 'updated profile contact details',
    timestamp: '45 mins ago',
    category: 'employee',
  },
  {
    id: 'act-3',
    user: 'Manager (Rajesh K.)',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    action: 'approved leave request for Sneha Kapur',
    timestamp: '2 hours ago',
    category: 'leave',
  },
  {
    id: 'act-4',
    user: 'HR Payroll Team',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    action: 'processed payroll records for August 2026',
    timestamp: '4 hours ago',
    category: 'payroll',
  },
  {
    id: 'act-5',
    user: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    action: 'published new Attendance Policy update',
    timestamp: 'Yesterday at 5:30 PM',
    category: 'policy',
  },
];

export const mockAnnouncements: AnnouncementItem[] = [
  {
    id: 'ann-1',
    title: 'Company Holiday Notice',
    content: 'Office will remain closed on September 15 for annual maintenance & wellness day.',
    date: 'Sep 08, 2026',
    category: 'Company Notice',
    isImportant: true,
  },
  {
    id: 'ann-2',
    title: 'HR Policy Update',
    content: 'New hybrid work & attendance tracking policy has been published in the Policy Center.',
    date: 'Sep 05, 2026',
    category: 'Policy Center',
    isImportant: false,
  },
  {
    id: 'ann-3',
    title: 'Annual Health Checkup Drive',
    content: 'Free employee wellness checkup scheduled for next week in Mumbai & Bangalore offices.',
    date: 'Sep 01, 2026',
    category: 'Wellness',
    isImportant: false,
  },
];
