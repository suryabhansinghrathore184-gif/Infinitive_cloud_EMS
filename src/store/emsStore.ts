'use client';

import { useState, useEffect } from 'react';
import {
  Employee,
  Department,
  Designation,
  Location,
  AttendanceRecord,
  LeaveRequestAdmin,
  RecentActivityItem,
  AnnouncementItem,
  EmployeeDocument,
  JobOpening,
  Candidate,
  SalaryStructure,
  SalaryRule,
  EmployeeSalaryProfile,
  EmployeeSalaryAssignment,
  PayrollRecord,
  PayrollSettings,
  PayrollStatus,
  AppNotification,
  NotificationPreference,
  NotificationSettingsState,
  NotificationCategory,
  NotificationPriority,
  NotificationDeliveryStatus,
  PerformanceReview,
} from '@/types/admin';
import { HolidayEvent } from '@/types/dashboard';
import { mockEmployees, mockDepartments, mockDesignations, mockLocations } from '@/data/employees';
import { mockAttendanceRecords, mockAdminLeaveRequests } from '@/data/attendance';
import { mockHolidayEvents, mockAnnouncements, mockRecentActivities } from '@/data/dashboard';
import { mockEmployeeDocuments, mockJobOpenings, mockCandidates, mockPayrollRecords, mockPerformanceReviews } from '@/data/modulesData';

export const defaultNotificationPreferences: NotificationPreference[] = [
  { id: 'pref-1', eventKey: 'employee_added', eventName: 'New Employee Added', category: 'employee', inApp: true, email: true, sms: false, whatsapp: false },
  { id: 'pref-2', eventKey: 'employee_updated', eventName: 'Employee Profile Updated', category: 'employee', inApp: true, email: false, sms: false, whatsapp: false },
  { id: 'pref-3', eventKey: 'employee_deactivated', eventName: 'Employee Deactivated', category: 'employee', inApp: true, email: true, sms: false, whatsapp: false },
  { id: 'pref-4', eventKey: 'leave_submitted', eventName: 'New Leave Request', category: 'leave', inApp: true, email: true, sms: false, whatsapp: true },
  { id: 'pref-5', eventKey: 'leave_approved', eventName: 'Leave Request Approved', category: 'leave', inApp: true, email: true, sms: false, whatsapp: true },
  { id: 'pref-6', eventKey: 'leave_rejected', eventName: 'Leave Request Rejected', category: 'leave', inApp: true, email: true, sms: false, whatsapp: false },
  { id: 'pref-7', eventKey: 'attendance_correction', eventName: 'Attendance Correction Request', category: 'attendance', inApp: true, email: false, sms: false, whatsapp: false },
  { id: 'pref-8', eventKey: 'payroll_calculated', eventName: 'Monthly Payroll Calculated', category: 'payroll', inApp: true, email: true, sms: false, whatsapp: false },
  { id: 'pref-9', eventKey: 'payroll_approval_required', eventName: 'Payroll Approval Required', category: 'payroll', inApp: true, email: true, sms: false, whatsapp: false },
  { id: 'pref-10', eventKey: 'payroll_approved', eventName: 'Payroll Approved', category: 'payroll', inApp: true, email: true, sms: false, whatsapp: true },
  { id: 'pref-11', eventKey: 'payslip_generated', eventName: 'Payslip Generated', category: 'payroll', inApp: true, email: true, sms: false, whatsapp: true },
  { id: 'pref-12', eventKey: 'document_uploaded', eventName: 'Document Uploaded', category: 'document', inApp: true, email: false, sms: false, whatsapp: false },
  { id: 'pref-13', eventKey: 'candidate_added', eventName: 'New Candidate Applied', category: 'recruitment', inApp: true, email: false, sms: false, whatsapp: false },
  { id: 'pref-14', eventKey: 'system_event', eventName: 'System & Security Event', category: 'system', inApp: true, email: true, sms: false, whatsapp: false },
];

export const defaultInitialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    recipientId: 'ADMIN',
    recipientRole: 'Admin',
    title: 'Payroll Approval Required',
    message: 'September 2026 monthly payroll calculation is complete and waiting for Admin approval.',
    category: 'payroll',
    priority: 'high',
    entityType: 'payroll',
    actionUrl: '/admin/payroll',
    isRead: false,
    deliveryStatus: 'delivered',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    recipientId: 'ADMIN',
    recipientRole: 'Admin',
    title: 'New Leave Request',
    message: 'Suryabhan Singh Rathore submitted a Casual Leave request for 2 days.',
    category: 'leave',
    priority: 'normal',
    entityType: 'leave',
    actionUrl: '/admin/leave',
    isRead: false,
    deliveryStatus: 'delivered',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    recipientId: 'ADMIN',
    recipientRole: 'Admin',
    title: 'Attendance Correction Request',
    message: 'Suryabhan Singh Rathore requested an attendance check-in correction for today.',
    category: 'attendance',
    priority: 'normal',
    entityType: 'attendance',
    actionUrl: '/admin/attendance',
    isRead: false,
    deliveryStatus: 'delivered',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

export const defaultNotificationSettings: NotificationSettingsState = {
  retentionDays: '90',
  smtp: {
    configured: false,
    host: 'smtp.mailtrap.io',
    port: 587,
    username: '',
    fromName: 'EMS HRMS System',
    fromEmail: 'noreply@infinitivecloud.com',
    useTls: true,
  },
  sms: {
    configured: false,
    provider: 'Twilio SMS Gateway',
    senderId: 'EMS-HR',
    apiKeySet: false,
  },
  whatsapp: {
    configured: false,
    phoneNumberId: '',
    businessAccountId: '',
    tokenSet: false,
  },
  preferences: defaultNotificationPreferences,
};

export interface CompanyInfo {
  name: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  currency: string;
  workingDays: string;
  contactEmail: string;
  contactPhone: string;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  description: string;
  allowanceDays: number;
  isPaid: boolean;
}

export interface AdminUserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
  phone: string;
}

export interface EmsDataState {
  company: CompanyInfo;
  adminUser: AdminUserProfile;
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  locations: Location[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequestAdmin[];
  leaveTypes: LeaveTypeConfig[];
  holidays: HolidayEvent[];
  announcements: AnnouncementItem[];
  activities: RecentActivityItem[];
  documents: EmployeeDocument[];
  jobs: JobOpening[];
  candidates: Candidate[];
  salaryStructures: SalaryStructure[];
  salaryRules: SalaryRule[];
  salaryAssignments: EmployeeSalaryAssignment[];
  employeeSalaryProfiles: Record<string, EmployeeSalaryProfile>;
  payrollRecords: PayrollRecord[];
  payrollSettings: PayrollSettings;
  notifications: AppNotification[];
  notificationSettings: NotificationSettingsState;
  performanceReviews: PerformanceReview[];
  isDemoData: boolean;
}

const STORAGE_KEY = 'ems_hrms_master_data_v2';

const cleanInitialState: EmsDataState = {
  company: {
    name: 'My New Enterprise Organization',
    logo: '',
    address: 'Enterprise HQ',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    timezone: 'Asia/Kolkata (IST +05:30)',
    currency: 'INR (₹)',
    workingDays: '5 Days (Mon - Fri)',
    contactEmail: 'admin@organization.com',
    contactPhone: '+91 22 1000 2000',
  },
  adminUser: {
    name: 'Admin',
    email: 'admin@organization.com',
    role: 'HR Administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
  },
  employees: [],
  departments: [],
  designations: [],
  locations: [],
  attendance: [],
  leaves: [],
  leaveTypes: [],
  holidays: [],
  announcements: [],
  activities: [],
  documents: [],
  jobs: [],
  candidates: [],
  performanceReviews: [],
  salaryAssignments: [
    {
      id: 'sal-assign-9201',
      employeeId: 'EMP9201',
      employeeName: 'Suryabhan Singh Rathore',
      structureId: 'struct-std',
      structureTitle: 'Standard Corporate Structure',
      effectiveDate: '2026-09-09',
      basicSalary: 60000,
      hra: 24000,
      conveyance: 3000,
      medical: 2000,
      specialAllowance: 10000,
      otherAllowances: 0,
      bonus: 0,
      pfEnabled: true,
      pfPercent: 12,
      ptEnabled: true,
      ptAmount: 200,
      tdsPercent: 10,
      esiEnabled: false,
      esiPercent: 0,
      status: 'Active',
      revisionReason: 'Initial Salary Assignment',
      createdBy: 'Admin',
      createdAt: '2026-09-09',
      updatedAt: '2026-09-09',
    },
  ],
  salaryStructures: [
    {
      id: 'struct-std',
      title: 'Standard Corporate Structure',
      description: 'Default structure for full-time corporate employees (HRA 40%, PF 12%, PT ₹200)',
      basicSalary: 60000,
      hraType: 'PercentBasic',
      hraValue: 40,
      conveyance: 3000,
      medical: 2000,
      specialAllowance: 10000,
      otherAllowances: 0,
      pfPercent: 12,
      ptAmount: 200,
      tdsPercent: 10,
      esiPercent: 0,
      effectiveDate: '2026-01-01',
      status: 'Active',
    },
  ],
  salaryRules: [
    {
      id: 'rule-hra',
      name: 'House Rent Allowance (HRA)',
      code: 'EARN_HRA',
      type: 'Earning',
      calcType: 'Percentage of Basic',
      value: 40,
      appliesTo: 'All Employees',
      effectiveFrom: '2026-01-01',
      active: true,
      description: 'Standard 40% of Basic Salary as HRA allowance',
    },
    {
      id: 'rule-pf',
      name: 'Provident Fund (PF)',
      code: 'DED_PF',
      type: 'Deduction',
      calcType: 'Percentage of Basic',
      value: 12,
      appliesTo: 'All Employees',
      effectiveFrom: '2026-01-01',
      active: true,
      description: 'Statutory 12% employee PF contribution from Basic Salary',
    },
    {
      id: 'rule-pt',
      name: 'Professional Tax (PT)',
      code: 'DED_PT',
      type: 'Deduction',
      calcType: 'Fixed Amount',
      value: 200,
      appliesTo: 'All Employees',
      effectiveFrom: '2026-01-01',
      active: true,
      description: 'State Professional Tax deduction fixed ₹200/month',
    },
    {
      id: 'rule-tds',
      name: 'Tax Deducted at Source (TDS)',
      code: 'DED_TDS',
      type: 'Deduction',
      calcType: 'Percentage of Gross',
      value: 10,
      appliesTo: 'All Employees',
      effectiveFrom: '2026-01-01',
      active: true,
      description: 'Income Tax TDS calculated as percentage of Gross Salary',
    },
  ],
  employeeSalaryProfiles: {},
  payrollRecords: [],
  payrollSettings: {
    payCycle: 'Monthly',
    workingDaysPerMonth: 26,
    overtimeRatePerHour: 250,
    pfDefaultPercent: 12,
    ptDefaultAmount: 200,
    tdsDefaultPercent: 10,
    esiDefaultPercent: 0.75,
    lopRule: 'Pro-rata Basic',
    payslipNumberFormat: 'PAY-{YEAR}-{MONTH}-{EMP}',
  },
  notifications: defaultInitialNotifications,
  notificationSettings: defaultNotificationSettings,
  isDemoData: false,
};

export function getInitialEmsState(): EmsDataState {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...cleanInitialState,
          ...parsed,
          company: parsed.company || cleanInitialState.company,
          adminUser: parsed.adminUser || cleanInitialState.adminUser,
          employees: Array.isArray(parsed.employees) ? parsed.employees : cleanInitialState.employees,
          departments: Array.isArray(parsed.departments) ? parsed.departments : cleanInitialState.departments,
          designations: Array.isArray(parsed.designations) ? parsed.designations : cleanInitialState.designations,
          locations: Array.isArray(parsed.locations) ? parsed.locations : cleanInitialState.locations,
          attendance: Array.isArray(parsed.attendance) ? parsed.attendance : cleanInitialState.attendance,
          leaves: Array.isArray(parsed.leaves) ? parsed.leaves : cleanInitialState.leaves,
          leaveTypes: Array.isArray(parsed.leaveTypes) ? parsed.leaveTypes : cleanInitialState.leaveTypes,
          holidays: Array.isArray(parsed.holidays) ? parsed.holidays : cleanInitialState.holidays,
          announcements: Array.isArray(parsed.announcements) ? parsed.announcements : cleanInitialState.announcements,
          activities: Array.isArray(parsed.activities) ? parsed.activities : cleanInitialState.activities,
          documents: Array.isArray(parsed.documents) ? parsed.documents : cleanInitialState.documents,
          jobs: Array.isArray(parsed.jobs) ? parsed.jobs : cleanInitialState.jobs,
          candidates: Array.isArray(parsed.candidates) ? parsed.candidates : cleanInitialState.candidates,
          salaryStructures: Array.isArray(parsed.salaryStructures) && parsed.salaryStructures.length > 0 ? parsed.salaryStructures : cleanInitialState.salaryStructures,
          salaryRules: Array.isArray(parsed.salaryRules) && parsed.salaryRules.length > 0 ? parsed.salaryRules : cleanInitialState.salaryRules,
          salaryAssignments: Array.isArray(parsed.salaryAssignments) && parsed.salaryAssignments.length > 0 ? parsed.salaryAssignments : cleanInitialState.salaryAssignments,
          employeeSalaryProfiles: parsed.employeeSalaryProfiles || {},
          payrollRecords: Array.isArray(parsed.payrollRecords) ? parsed.payrollRecords : cleanInitialState.payrollRecords,
          payrollSettings: parsed.payrollSettings || cleanInitialState.payrollSettings,
          notifications: Array.isArray(parsed.notifications) ? parsed.notifications : defaultInitialNotifications,
          notificationSettings: parsed.notificationSettings || defaultNotificationSettings,
        };
      } catch (e) {
        console.error('Failed to parse saved EMS data state', e);
      }
    }
  }
  return cleanInitialState;
}

export function useEmsStore() {
  const [state, setState] = useState<EmsDataState>(cleanInitialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = getInitialEmsState();
    setState(loaded);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isHydrated]);

  // Activity logger helper
  const logActivity = (user: string, action: string, category: RecentActivityItem['category'] = 'employee') => {
    const newAct: RecentActivityItem = {
      id: `act-${Date.now()}`,
      user,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      action,
      timestamp: 'Just now',
      category,
    };
    setState((prev) => ({
      ...prev,
      activities: [newAct, ...prev.activities],
    }));
  };

  // 1. ADD EMPLOYEE
  const addEmployee = (newEmp: Omit<Employee, 'id'>): { success: boolean; message: string } => {
    const existsId = state.employees.some(
      (e) => e.employeeId.trim().toLowerCase() === newEmp.employeeId.trim().toLowerCase()
    );
    if (existsId) {
      return { success: false, message: `Employee ID "${newEmp.employeeId}" already exists. Must be unique.` };
    }

    const existsEmail = state.employees.some(
      (e) => e.email.trim().toLowerCase() === newEmp.email.trim().toLowerCase()
    );
    if (existsEmail) {
      return { success: false, message: `Email "${newEmp.email}" is already registered.` };
    }

    const created: Employee = {
      ...newEmp,
      id: `emp-${Date.now()}`,
    };

    setState((prev) => ({
      ...prev,
      employees: [created, ...prev.employees],
      activities: [
        {
          id: `act-${Date.now()}`,
          user: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
          action: `added new employee ${created.firstName} ${created.lastName} (${created.employeeId})`,
          timestamp: 'Just now',
          category: 'employee',
        },
        ...prev.activities,
      ],
    }));

    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'New Employee Added',
      message: `Employee ${created.firstName} ${created.lastName} (${created.employeeId}) has been added to the organization.`,
      category: 'employee',
      priority: 'normal',
      entityType: 'employee',
      entityId: created.id,
      actionUrl: '/admin/employees',
    });

    return { success: true, message: `Employee ${created.firstName} ${created.lastName} (${created.employeeId}) added successfully!` };
  };

  const deactivateEmployee = (id: string) => {
    const target = state.employees.find((e) => e.id === id);
    if (target) {
      setState((prev) => ({
        ...prev,
        employees: prev.employees.map((e) => (e.id === id ? { ...e, status: 'Terminated' as const } : e)),
      }));
      logActivity('Admin', `deactivated employee record ${target.employeeId}`);
      createNotification({
        recipientId: 'ADMIN',
        recipientRole: 'Admin',
        title: 'Employee Deactivated',
        message: `Employee ${target.firstName} ${target.lastName} (${target.employeeId}) has been deactivated.`,
        category: 'employee',
        priority: 'high',
        entityType: 'employee',
        entityId: target.id,
        actionUrl: '/admin/employees',
      });
    }
  };

  // 2. ADD DEPARTMENT
  const addDepartment = (dept: { name: string; head?: string; description?: string }) => {
    const created: Department = {
      id: `dept-${Date.now()}`,
      name: dept.name,
      code: dept.name.substring(0, 3).toUpperCase(),
      head: dept.head || 'Unassigned',
      employeeCount: 0,
      description: dept.description || 'Department Unit',
      status: 'Active',
    };
    setState((prev) => ({
      ...prev,
      departments: [...prev.departments, created],
    }));
    logActivity('Admin', `created new department "${created.name}"`);
  };

  // 3. ADD DESIGNATION
  const addDesignation = (desg: { title: string; department: string }) => {
    const created: Designation = {
      id: `des-${Date.now()}`,
      title: desg.title,
      code: desg.title.substring(0, 3).toUpperCase(),
      department: desg.department,
      level: 'L3',
      employeeCount: 0,
    };
    setState((prev) => ({
      ...prev,
      designations: [...prev.designations, created],
    }));
    logActivity('Admin', `created new designation "${created.title}"`);
  };

  // 4. ADD HOLIDAY
  const addHoliday = (holiday: Omit<HolidayEvent, 'id'>) => {
    const created: HolidayEvent = {
      ...holiday,
      id: `hol-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      holidays: [...prev.holidays, created],
    }));
    logActivity('Admin', `added company holiday "${created.name}" (${created.date})`);
  };

  // 5. CREATE ANNOUNCEMENT
  const createAnnouncement = (ann: { title: string; content: string; category: string; isImportant?: boolean }) => {
    const created: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: ann.title,
      content: ann.content,
      category: ann.category,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      isImportant: ann.isImportant || false,
    };
    setState((prev) => ({
      ...prev,
      announcements: [created, ...prev.announcements],
    }));
    logActivity('Admin', `published announcement "${created.title}"`, 'policy');
  };

  // 6. ADD LEAVE TYPE & LEAVE REQUESTS
  const addLeaveType = (leaveType: { name: string; description: string; allowanceDays: number; isPaid: boolean }) => {
    const created: LeaveTypeConfig = {
      id: `lt-${Date.now()}`,
      ...leaveType,
    };
    setState((prev) => ({
      ...prev,
      leaveTypes: [...prev.leaveTypes, created],
    }));
    logActivity('Admin', `configured leave type "${created.name}" (${created.allowanceDays} Days)`);
  };

  const addLeaveRequest = (req: Omit<LeaveRequestAdmin, 'id' | 'requestedDate' | 'status'>) => {
    const created: LeaveRequestAdmin = {
      ...req,
      id: `lvr-${Date.now()}`,
      requestedDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    setState((prev) => ({
      ...prev,
      leaves: [created, ...prev.leaves],
    }));
    logActivity('Admin', `logged leave request for ${created.employeeName} (${created.durationDays} days)`, 'employee');
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'New Leave Request',
      message: `${created.employeeName} submitted a ${created.leaveType} request for ${created.durationDays} day(s).`,
      category: 'leave',
      priority: 'normal',
      entityType: 'leave',
      entityId: created.id,
      actionUrl: '/admin/leave',
    });
    return created;
  };

  const updateLeaveRequestStatus = (id: string, status: LeaveRequestAdmin['status']) => {
    let targetReq: LeaveRequestAdmin | undefined;
    setState((prev) => {
      const nextLeaves = prev.leaves.map((l) => {
        if (l.id !== id) return l;
        targetReq = { ...l, status };
        return targetReq;
      });
      return {
        ...prev,
        leaves: nextLeaves,
      };
    });

    if (targetReq) {
      logActivity('Admin', `updated leave request status for ${targetReq.employeeName} to "${status}"`, 'employee');
      const notifTitle = status === 'Approved' ? 'Leave Approved' : status === 'Rejected' ? 'Leave Rejected' : 'Leave Status Updated';
      createNotification({
        recipientId: 'ADMIN',
        recipientRole: 'Admin',
        title: notifTitle,
        message: `Leave request for ${targetReq.employeeName} (${targetReq.leaveType}, ${targetReq.durationDays} days) has been ${status.toLowerCase()}.`,
        category: 'leave',
        priority: status === 'Approved' ? 'normal' : 'high',
        entityType: 'leave',
        entityId: id,
        actionUrl: '/admin/leave',
      });
    }
  };

  // 7. ADD DOCUMENT
  const addDocument = (doc: Omit<EmployeeDocument, 'id' | 'uploadDate'>) => {
    const created: EmployeeDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    setState((prev) => ({
      ...prev,
      documents: [created, ...(prev.documents || [])],
    }));
    logActivity('Admin', `uploaded document "${created.title}" for ${created.employeeName}`, 'policy');
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'Document Uploaded',
      message: `Document "${created.title}" was uploaded for employee ${created.employeeName}.`,
      category: 'document',
      priority: 'normal',
      entityType: 'document',
      entityId: created.id,
      actionUrl: '/admin/documents',
    });
  };

  // 8. ADD ATTENDANCE RECORD
  const addAttendanceRecord = (rec: Omit<AttendanceRecord, 'id' | 'workingHours'>) => {
    const created: AttendanceRecord = {
      ...rec,
      id: `att-${Date.now()}`,
      workingHours: '8 hrs 00 mins',
    };
    setState((prev) => ({
      ...prev,
      attendance: [created, ...prev.attendance],
    }));
    logActivity('Admin', `logged attendance for ${rec.employeeName} (${rec.status})`, 'employee');
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'Attendance Recorded',
      message: `Attendance record for ${rec.employeeName} logged as "${rec.status}" for ${rec.date}.`,
      category: 'attendance',
      priority: 'normal',
      entityType: 'attendance',
      entityId: created.id,
      actionUrl: '/admin/attendance',
    });
  };

  // 9. UPDATE ADMIN PROFILE
  const updateAdminProfile = (updated: Partial<AdminUserProfile>) => {
    setState((prev) => ({
      ...prev,
      adminUser: {
        ...(prev.adminUser || {
          name: 'Admin',
          email: 'admin@organization.com',
          role: 'HR Administrator',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
          phone: '+91 98765 43210',
        }),
        ...updated,
      },
    }));
    logActivity('Admin', 'updated Admin profile photo & account details');
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'Admin Profile Updated',
      message: 'HR Administrator profile details and avatar photo updated.',
      category: 'system',
      priority: 'normal',
      actionUrl: '/admin/settings',
    });
  };

  // NOTIFICATION SERVICE METHODS
  const createNotification = (
    notifData: Omit<AppNotification, 'id' | 'createdAt' | 'updatedAt' | 'isRead' | 'deliveryStatus'> & {
      isRead?: boolean;
      deliveryStatus?: NotificationDeliveryStatus;
    }
  ) => {
    const created: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientId: notifData.recipientId || 'ADMIN',
      recipientRole: notifData.recipientRole || 'Admin',
      title: notifData.title,
      message: notifData.message,
      category: notifData.category,
      priority: notifData.priority || 'normal',
      entityType: notifData.entityType,
      entityId: notifData.entityId,
      actionUrl: notifData.actionUrl || '/admin/notifications',
      isRead: notifData.isRead || false,
      deliveryStatus: notifData.deliveryStatus || 'delivered',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      notifications: [created, ...(prev.notifications || [])],
    }));

    return created;
  };

  const markNotificationAsRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : n
      ),
    }));
  };

  const markAllNotificationsAsRead = () => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || now,
        updatedAt: now,
      })),
    }));
  };

  const deleteNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).filter((n) => n.id !== id),
    }));
  };

  const updateNotificationSettings = (newSettings: Partial<NotificationSettingsState>) => {
    setState((prev) => ({
      ...prev,
      notificationSettings: {
        ...(prev.notificationSettings || defaultNotificationSettings),
        ...newSettings,
      },
    }));
    logActivity('Admin', 'updated Notification delivery channel settings & preferences', 'policy');
  };

  const testChannelConfig = (channel: 'email' | 'sms' | 'whatsapp', targetRecipient: string): { success: boolean; message: string } => {
    const timestamp = new Date().toLocaleTimeString();
    let title = '';
    let message = '';

    if (channel === 'email') {
      title = 'Test Email Dispatch Sent';
      message = `Test email dispatch delivered to ${targetRecipient} at ${timestamp}. SMTP configuration verified.`;
    } else if (channel === 'sms') {
      title = 'Test SMS Broadcast Sent';
      message = `Test SMS broadcast delivered to ${targetRecipient} at ${timestamp}. SMS provider verified.`;
    } else {
      title = 'Test WhatsApp Message Sent';
      message = `Test WhatsApp Business API alert sent to ${targetRecipient} at ${timestamp}. WhatsApp API verified.`;
    }

    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title,
      message,
      category: 'system',
      priority: 'normal',
      actionUrl: '/admin/notifications',
    });

    logActivity('Admin', `executed ${channel.toUpperCase()} integration test`, 'policy');
    return { success: true, message: `Test ${channel.toUpperCase()} dispatch sent successfully to ${targetRecipient}.` };
  };

  const importEmployees = (batch: Omit<Employee, 'id'>[]): { added: number; skippedDuplicates: number; message: string } => {
    let importedCount = 0;
    let skippedDuplicates = 0;
    const newRecords: Employee[] = [];

    batch.forEach((emp, index) => {
      const existsId = state.employees.some((e) => e.employeeId.trim().toLowerCase() === emp.employeeId.trim().toLowerCase());
      if (existsId) {
        skippedDuplicates++;
        return;
      }

      const created: Employee = {
        ...emp,
        id: `emp-imp-${Date.now()}-${index}`,
      };
      newRecords.push(created);
      importedCount++;
    });

    if (importedCount > 0) {
      setState((prev) => ({
        ...prev,
        employees: [...newRecords, ...prev.employees],
        activities: [
          {
            id: `act-${Date.now()}`,
            user: 'Admin',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
            action: `batch imported ${importedCount} employee records via CSV`,
            timestamp: 'Just now',
            category: 'employee',
          },
          ...prev.activities,
        ],
      }));
    }

    return {
      added: importedCount,
      skippedDuplicates,
      message: `Successfully imported ${importedCount} employees. (${skippedDuplicates} duplicates skipped)`,
    };
  };

  const addJobOpening = (newJob: Omit<JobOpening, 'id' | 'postedDate' | 'candidatesCount'>) => {
    const created: JobOpening = {
      ...newJob,
      id: `job-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      candidatesCount: 0,
    };
    setState((prev) => ({
      ...prev,
      jobs: [created, ...(prev.jobs || [])],
    }));
    logActivity('Admin', `created job requisition "${created.jobTitle}" in ${created.department}`);
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'Job Opening Created',
      message: `Job requisition "${created.jobTitle}" posted for department ${created.department}.`,
      category: 'recruitment',
      priority: 'normal',
      entityType: 'job',
      entityId: created.id,
      actionUrl: '/admin/recruitment',
    });
    return created;
  };

  const addCandidate = (newCand: Omit<Candidate, 'id' | 'appliedDate'>) => {
    const created: Candidate = {
      ...newCand,
      id: `cand-${Date.now()}`,
      appliedDate: new Date().toISOString().split('T')[0],
    };
    setState((prev) => {
      const updatedJobs = (prev.jobs || []).map((j) =>
        j.id === created.jobId ? { ...j, candidatesCount: (j.candidatesCount || 0) + 1 } : j
      );
      return {
        ...prev,
        jobs: updatedJobs,
        candidates: [created, ...(prev.candidates || [])],
      };
    });
    logActivity('Admin', `added candidate ${created.name} for ${created.jobTitle}`, 'employee');
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'New Candidate Applied',
      message: `Candidate ${created.name} applied for "${created.jobTitle}".`,
      category: 'recruitment',
      priority: 'normal',
      entityType: 'candidate',
      entityId: created.id,
      actionUrl: '/admin/recruitment',
    });
    return created;
  };

  // Performance Reviews CRUD
  const addPerformanceReview = (review: Omit<PerformanceReview, 'id'>) => {
    const created: PerformanceReview = {
      ...review,
      id: `perf-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      performanceReviews: [created, ...(prev.performanceReviews || [])],
    }));
    logActivity('Admin', `launched performance review cycle "${created.cycle}" for ${created.employeeName}`);
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'Performance Review Cycle Launched',
      message: `Performance review cycle "${created.cycle}" initiated for ${created.employeeName}.`,
      category: 'system',
      priority: 'normal',
      actionUrl: '/admin/performance',
    });
    return created;
  };

  const updatePerformanceReview = (id: string, updates: Partial<PerformanceReview>) => {
    setState((prev) => ({
      ...prev,
      performanceReviews: (prev.performanceReviews || []).map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
    logActivity('Admin', 'updated performance review record');
  };

  const deletePerformanceReview = (id: string) => {
    setState((prev) => ({
      ...prev,
      performanceReviews: (prev.performanceReviews || []).filter((r) => r.id !== id),
    }));
    logActivity('Admin', 'deleted performance review record');
  };

  // Reset & Seed Controls
  // Salary Structures
  const addSalaryStructure = (struct: Omit<SalaryStructure, 'id'>) => {
    const created: SalaryStructure = {
      ...struct,
      id: `struct-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      salaryStructures: [created, ...(prev.salaryStructures || [])],
    }));
    logActivity('Admin', `created salary structure "${created.title}"`);
    return created;
  };

  const updateSalaryStructure = (id: string, updated: Partial<SalaryStructure>) => {
    setState((prev) => ({
      ...prev,
      salaryStructures: (prev.salaryStructures || []).map((s) =>
        s.id === id ? { ...s, ...updated } : s
      ),
    }));
    logActivity('Admin', 'updated salary structure');
  };

  const deleteSalaryStructure = (id: string): { success: boolean; message: string } => {
    const isAssigned = Object.values(state.employeeSalaryProfiles || {}).some(
      (p) => p.structureId === id
    );
    if (isAssigned) {
      return {
        success: false,
        message: 'Cannot delete salary structure because it is currently assigned to one or more employees.',
      };
    }
    setState((prev) => ({
      ...prev,
      salaryStructures: (prev.salaryStructures || []).filter((s) => s.id !== id),
    }));
    logActivity('Admin', 'deleted salary structure');
    return { success: true, message: 'Salary structure deleted successfully.' };
  };

  // Salary Rules
  const addSalaryRule = (rule: Omit<SalaryRule, 'id'>) => {
    const created: SalaryRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      salaryRules: [created, ...(prev.salaryRules || [])],
    }));
    logActivity('Admin', `created salary rule "${created.name}" (${created.code})`);
    return created;
  };

  const updateSalaryRule = (id: string, updated: Partial<SalaryRule>) => {
    setState((prev) => ({
      ...prev,
      salaryRules: (prev.salaryRules || []).map((r) => (r.id === id ? { ...r, ...updated } : r)),
    }));
    logActivity('Admin', 'updated salary rule');
  };

  const deleteSalaryRule = (id: string) => {
    setState((prev) => ({
      ...prev,
      salaryRules: (prev.salaryRules || []).filter((r) => r.id !== id),
    }));
    logActivity('Admin', 'deleted salary rule');
  };

  // Salary Assignments CRUD
  const addSalaryAssignment = (assignment: Omit<EmployeeSalaryAssignment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created: EmployeeSalaryAssignment = {
      ...assignment,
      id: `sal-assign-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assignEmployeeSalaryProfile(
      assignment.employeeId,
      {
        structureId: assignment.structureId,
        structureTitle: assignment.structureTitle,
        basicSalary: assignment.basicSalary,
        hra: assignment.hra,
        conveyance: assignment.conveyance,
        medical: assignment.medical,
        specialAllowance: assignment.specialAllowance,
        otherAllowances: assignment.otherAllowances || 0,
        bonus: assignment.bonus || 0,
        overtimeRatePerHour: state.payrollSettings?.overtimeRatePerHour || 250,
        pfEnabled: assignment.pfEnabled,
        pfPercent: assignment.pfPercent,
        ptEnabled: assignment.ptEnabled,
        ptAmount: assignment.ptAmount,
        tdsPercent: assignment.tdsPercent,
        esiEnabled: assignment.esiEnabled,
        esiPercent: assignment.esiPercent,
        effectiveDate: assignment.effectiveDate,
      },
      assignment.revisionReason || 'Salary structure assigned'
    );

    setState((prev) => ({
      ...prev,
      salaryAssignments: [created, ...(prev.salaryAssignments || [])],
    }));

    logActivity('Admin', `assigned salary structure to ${assignment.employeeName} (${assignment.structureTitle})`, 'employee');
    return created;
  };

  const updateSalaryAssignment = (id: string, updated: Partial<EmployeeSalaryAssignment>) => {
    let targetAssign: EmployeeSalaryAssignment | undefined;

    setState((prev) => {
      const nextList = (prev.salaryAssignments || []).map((sa) => {
        if (sa.id !== id) return sa;
        targetAssign = { ...sa, ...updated, updatedAt: new Date().toISOString() };
        return targetAssign;
      });
      return {
        ...prev,
        salaryAssignments: nextList,
      };
    });

    if (targetAssign) {
      assignEmployeeSalaryProfile(
        targetAssign.employeeId,
        {
          structureId: targetAssign.structureId,
          structureTitle: targetAssign.structureTitle,
          basicSalary: targetAssign.basicSalary,
          hra: targetAssign.hra,
          conveyance: targetAssign.conveyance,
          medical: targetAssign.medical,
          specialAllowance: targetAssign.specialAllowance,
          otherAllowances: targetAssign.otherAllowances || 0,
          bonus: targetAssign.bonus || 0,
          overtimeRatePerHour: state.payrollSettings?.overtimeRatePerHour || 250,
          pfEnabled: targetAssign.pfEnabled,
          pfPercent: targetAssign.pfPercent,
          ptEnabled: targetAssign.ptEnabled,
          ptAmount: targetAssign.ptAmount,
          tdsPercent: targetAssign.tdsPercent,
          esiEnabled: targetAssign.esiEnabled,
          esiPercent: targetAssign.esiPercent,
          effectiveDate: targetAssign.effectiveDate,
        },
        targetAssign.revisionReason || 'Salary structure updated'
      );

      logActivity('Admin', `updated salary assignment for ${targetAssign.employeeName}`, 'employee');
    }
  };

  const deactivateSalaryAssignment = (id: string, reason?: string) => {
    const target = (state.salaryAssignments || []).find((sa) => sa.id === id);
    if (!target) return;

    setState((prev) => ({
      ...prev,
      salaryAssignments: (prev.salaryAssignments || []).map((sa) =>
        sa.id === id ? { ...sa, status: 'Inactive' as const, updatedAt: new Date().toISOString() } : sa
      ),
    }));

    logActivity('Admin', `deactivated salary structure assignment for ${target.employeeName} (${reason || 'Deactivated'})`, 'employee');
  };

  const deleteSalaryAssignment = (id: string, reason?: string): { success: boolean; message: string; requiresDeactivation?: boolean } => {
    const target = (state.salaryAssignments || []).find((sa) => sa.id === id);
    if (!target) return { success: false, message: 'Salary assignment record not found.' };

    const hasFinalizedPayroll = (state.payrollRecords || []).some(
      (p) =>
        (p.employeeId === target.employeeId || p.employeeName.toLowerCase().trim() === target.employeeName.toLowerCase().trim()) &&
        (p.status === 'Approved' || p.status === 'Processed' || p.status === 'Paid')
    );

    if (hasFinalizedPayroll) {
      return {
        success: false,
        requiresDeactivation: true,
        message: `Cannot hard-delete salary structure for ${target.employeeName} because it is referenced in past finalized payroll records (Approved/Processed/Paid). You can deactivate this assignment instead.`,
      };
    }

    setState((prev) => ({
      ...prev,
      salaryAssignments: (prev.salaryAssignments || []).filter((sa) => sa.id !== id),
    }));

    logActivity('Admin', `deleted salary structure assignment for ${target.employeeName} (${reason || 'Deleted'})`, 'employee');
    return { success: true, message: `Salary assignment for ${target.employeeName} deleted successfully.` };
  };

  // Employee Salary Profiles
  const assignEmployeeSalaryProfile = (
    employeeId: string,
    profileData: Omit<EmployeeSalaryProfile, 'employeeId' | 'history'>,
    reason: string = 'Salary structure assigned/updated'
  ) => {
    const matchedEmp = state.employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    const empKey = matchedEmp?.id || employeeId;
    const empIdKey = matchedEmp?.employeeId || employeeId;

    const existing = state.employeeSalaryProfiles?.[empKey] || state.employeeSalaryProfiles?.[empIdKey];
    const newHistoryItem = {
      id: `hist-${Date.now()}`,
      effectiveDate: profileData.effectiveDate || new Date().toISOString().split('T')[0],
      basicSalary: profileData.basicSalary,
      grossSalary:
        profileData.basicSalary +
        profileData.hra +
        profileData.conveyance +
        profileData.medical +
        profileData.specialAllowance +
        profileData.otherAllowances +
        profileData.bonus,
      netSalary: 0,
      changedBy: 'Admin',
      changeReason: reason,
      updatedAt: new Date().toISOString(),
    };

    const updatedProfile: EmployeeSalaryProfile = {
      ...profileData,
      employeeId: empKey,
      history: [newHistoryItem, ...(existing?.history || [])],
    };

    // Auto-update existing Draft/Calculated payroll records for this employee
    const basic = profileData.basicSalary;
    const hra = profileData.hra;
    const conveyance = profileData.conveyance;
    const medical = profileData.medical;
    const specialAllowance = profileData.specialAllowance;
    const otherAllowances = profileData.otherAllowances || 0;
    const bonus = profileData.bonus || 0;

    const workingDays = state.payrollSettings?.workingDaysPerMonth || 26;

    const updatedPayrollRecords = (state.payrollRecords || []).map((p) => {
      const isThisEmp = p.employeeId === empKey || p.employeeId === empIdKey;
      if (!isThisEmp || (p.status !== 'Draft' && p.status !== 'Calculated')) {
        return p;
      }

      const grossSalary = basic + hra + conveyance + medical + specialAllowance + otherAllowances + (p.overtimePay || 0) + bonus;

      const lopDeduction = p.unpaidLeaveDays > 0 ? Math.round((basic / workingDays) * p.unpaidLeaveDays) : 0;
      const pfDeduction = profileData.pfEnabled !== false ? Math.round(basic * ((profileData.pfPercent || state.payrollSettings?.pfDefaultPercent || 12) / 100)) : 0;
      const ptDeduction = profileData.ptEnabled !== false ? (profileData.ptAmount || state.payrollSettings?.ptDefaultAmount || 200) : 0;
      const taxDeduction = Math.round(grossSalary * ((profileData.tdsPercent || state.payrollSettings?.tdsDefaultPercent || 10) / 100));
      const esiDeduction = profileData.esiEnabled ? Math.round(grossSalary * ((profileData.esiPercent || 0.75) / 100)) : 0;

      const totalDeductions = lopDeduction + pfDeduction + ptDeduction + taxDeduction + esiDeduction + (p.loanDeduction || 0) + (p.otherDeductions || 0);
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      return {
        ...p,
        basicSalary: basic,
        hra,
        conveyance,
        medical,
        specialAllowance,
        otherAllowances,
        bonus,
        grossSalary,
        lopDeduction,
        pfDeduction,
        ptDeduction,
        taxDeduction,
        esiDeduction,
        totalDeductions,
        netSalary,
        updatedAt: new Date().toISOString(),
      };
    });

    setState((prev) => ({
      ...prev,
      employeeSalaryProfiles: {
        ...(prev.employeeSalaryProfiles || {}),
        [empKey]: updatedProfile,
        [empIdKey]: updatedProfile,
      },
      payrollRecords: updatedPayrollRecords,
    }));

    logActivity('Admin', `assigned salary profile to employee ${matchedEmp ? matchedEmp.firstName + ' ' + matchedEmp.lastName : employeeId}`, 'employee');
    return updatedProfile;
  };

  // Process Monthly Payroll Calculation Engine
  const processMonthlyPayroll = (month: number, year: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const payPeriod = `${monthNames[month - 1]} ${year}`;

    const activeEmployees = state.employees.filter((e) => e.status !== 'Terminated' && e.status !== 'Former Employee');
    const existingPeriodRecords = (state.payrollRecords || []).filter((p) => p.payMonth === month && p.payYear === year);

    if (activeEmployees.length === 0) {
      return { success: false, count: 0, message: 'No active employees found to process payroll.' };
    }

    const newRecords: PayrollRecord[] = [];
    const workingDays = state.payrollSettings?.workingDaysPerMonth || 26;

    activeEmployees.forEach((emp) => {
      const alreadyExists = existingPeriodRecords.some((p) => p.employeeId === emp.employeeId || p.employeeId === emp.id);
      if (alreadyExists) return;

      const profile = state.employeeSalaryProfiles?.[emp.id] || state.employeeSalaryProfiles?.[emp.employeeId];
      const stdStruct = state.salaryStructures?.[0];

      const basic = profile?.basicSalary || stdStruct?.basicSalary || 50000;
      const hra = profile?.hra ?? (stdStruct?.hraType === 'PercentBasic' ? Math.round(basic * ((stdStruct?.hraValue || 40) / 100)) : (stdStruct?.hraValue || 20000));
      const conveyance = profile?.conveyance ?? (stdStruct?.conveyance || 3000);
      const medical = profile?.medical ?? (stdStruct?.medical || 2000);
      const specialAllowance = profile?.specialAllowance ?? (stdStruct?.specialAllowance || 5000);
      const otherAllowances = profile?.otherAllowances ?? 0;
      const bonus = profile?.bonus ?? 0;

      // Attendance data calculation
      const empAttendance = (state.attendance || []).filter((a) => a.employeeId === emp.id || a.employeeId === emp.employeeId);
      const presentCount = empAttendance.filter((a) => a.status === 'Present' || a.status === 'Work From Home' || a.status === 'Half Day').length || workingDays - 1;

      // Leave data calculation
      const empLeaves = (state.leaves || []).filter((l) => (l.employeeId === emp.id || l.employeeId === emp.employeeId) && l.status === 'Approved');
      const unpaidLeaveDays = empLeaves.reduce((acc, l) => acc + (l.leaveType.toLowerCase().includes('unpaid') || l.leaveType.toLowerCase().includes('lop') ? l.durationDays : 0), 0);
      const paidLeaveDays = empLeaves.reduce((acc, l) => acc + (!l.leaveType.toLowerCase().includes('unpaid') && !l.leaveType.toLowerCase().includes('lop') ? l.durationDays : 0), 0);

      const actualPresent = Math.min(workingDays, presentCount > 0 ? presentCount : workingDays - unpaidLeaveDays);

      // Overtime
      const overtimeHours = 0;
      const overtimeRate = profile?.overtimeRatePerHour || state.payrollSettings?.overtimeRatePerHour || 250;
      const overtimePay = overtimeHours * overtimeRate;

      const grossSalary = basic + hra + conveyance + medical + specialAllowance + otherAllowances + overtimePay + bonus;

      // Deductions
      const lopDeduction = unpaidLeaveDays > 0 ? Math.round((basic / workingDays) * unpaidLeaveDays) : 0;
      const pfDeduction = profile?.pfEnabled !== false ? Math.round(basic * ((profile?.pfPercent || state.payrollSettings?.pfDefaultPercent || 12) / 100)) : 0;
      const ptDeduction = profile?.ptEnabled !== false ? (profile?.ptAmount || state.payrollSettings?.ptDefaultAmount || 200) : 0;
      const taxDeduction = Math.round(grossSalary * ((profile?.tdsPercent || state.payrollSettings?.tdsDefaultPercent || 10) / 100));
      const esiDeduction = profile?.esiEnabled ? Math.round(grossSalary * ((profile?.esiPercent || state.payrollSettings?.esiDefaultPercent || 0.75) / 100)) : 0;
      const loanDeduction = 0;
      const otherDeductions = 0;

      const totalDeductions = lopDeduction + pfDeduction + ptDeduction + taxDeduction + esiDeduction + loanDeduction + otherDeductions;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      const record: PayrollRecord = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        employeeId: emp.employeeId || emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        avatar: emp.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
        department: emp.department || 'General',
        designation: emp.designation || 'Staff',
        joiningDate: emp.joiningDate,
        payPeriod,
        payMonth: month,
        payYear: year,
        workingDays,
        presentDays: actualPresent,
        paidLeaveDays,
        unpaidLeaveDays,
        overtimeHours,
        overtimeRate,
        basicSalary: basic,
        hra,
        conveyance,
        medical,
        specialAllowance,
        otherAllowances,
        overtimePay,
        bonus,
        otherEarnings: 0,
        grossSalary,
        lopDeduction,
        pfDeduction,
        ptDeduction,
        taxDeduction,
        esiDeduction,
        loanDeduction,
        otherDeductions,
        totalDeductions,
        netSalary,
        status: 'Calculated',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      newRecords.push(record);
    });

    if (newRecords.length === 0) {
      return { success: false, count: 0, message: `Payroll for ${payPeriod} has already been calculated for all active employees.` };
    }

    setState((prev) => ({
      ...prev,
      payrollRecords: [...newRecords, ...(prev.payrollRecords || [])],
    }));

    logActivity('Admin', `processed payroll for ${payPeriod} (${newRecords.length} records calculated)`);
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'Monthly Payroll Calculated',
      message: `${payPeriod} payroll has been calculated for ${newRecords.length} employees and is ready for review.`,
      category: 'payroll',
      priority: 'high',
      entityType: 'payroll',
      actionUrl: '/admin/payroll',
    });
    createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: 'Payroll Approval Required',
      message: `${payPeriod} monthly payroll requires Admin review and final approval.`,
      category: 'payroll',
      priority: 'high',
      entityType: 'payroll',
      actionUrl: '/admin/payroll',
    });
    return { success: true, count: newRecords.length, message: `Successfully calculated ${newRecords.length} payroll records for ${payPeriod}.` };
  };

  const updatePayrollRecord = (id: string, updates: Partial<PayrollRecord>, reason: string) => {
    setState((prev) => ({
      ...prev,
      payrollRecords: (prev.payrollRecords || []).map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...updates };

        next.grossSalary =
          (next.basicSalary || 0) +
          (next.hra || 0) +
          (next.conveyance || 0) +
          (next.medical || 0) +
          (next.specialAllowance || 0) +
          (next.otherAllowances || 0) +
          (next.overtimePay || 0) +
          (next.bonus || 0) +
          (next.otherEarnings || 0);

        next.totalDeductions =
          (next.lopDeduction || 0) +
          (next.pfDeduction || 0) +
          (next.ptDeduction || 0) +
          (next.taxDeduction || 0) +
          (next.esiDeduction || 0) +
          (next.loanDeduction || 0) +
          (next.otherDeductions || 0);

        const newNet = Math.max(0, next.grossSalary - next.totalDeductions);
        const adjustment = {
          date: new Date().toISOString(),
          user: 'Admin',
          originalNet: p.netSalary,
          adjustedNet: newNet,
          reason: reason || 'Manual adjustment by Admin',
        };
        next.netSalary = newNet;
        next.adjustmentHistory = [adjustment, ...(p.adjustmentHistory || [])];
        next.updatedAt = new Date().toISOString();
        return next;
      }),
    }));
    logActivity('Admin', `edited payroll record for ID ${id} (${reason})`);
  };

  const updatePayrollStatus = (id: string, status: PayrollStatus) => {
    const record = (state.payrollRecords || []).find((p) => p.id === id);
    const empTitleName = record ? record.employeeName : 'Employee';
    const periodName = record ? record.payPeriod : 'Monthly';

    setState((prev) => ({
      ...prev,
      payrollRecords: (prev.payrollRecords || []).map((p) =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      ),
    }));
    logActivity('Admin', `updated payroll status to ${status}`);

    if (status === 'Approved') {
      createNotification({
        recipientId: 'ADMIN',
        recipientRole: 'Admin',
        title: 'Payroll Approved',
        message: `${periodName} payroll for ${empTitleName} has been approved by Admin.`,
        category: 'payroll',
        priority: 'high',
        entityType: 'payroll',
        entityId: id,
        actionUrl: '/admin/payroll',
      });
      createNotification({
        recipientId: 'ADMIN',
        recipientRole: 'Admin',
        title: 'Payslip Generated',
        message: `Payslip for ${empTitleName} for ${periodName} is ready.`,
        category: 'payroll',
        priority: 'normal',
        entityType: 'payroll',
        entityId: id,
        actionUrl: '/admin/payroll',
      });
    } else if (status === 'Processed' || status === 'Paid') {
      createNotification({
        recipientId: 'ADMIN',
        recipientRole: 'Admin',
        title: 'Payroll Processed',
        message: `${periodName} payroll for ${empTitleName} marked as ${status}. Salary disbursement recorded.`,
        category: 'payroll',
        priority: 'normal',
        entityType: 'payroll',
        entityId: id,
        actionUrl: '/admin/payroll',
      });
    }
  };

  const deletePayrollRecord = (id: string, reason: string): { success: boolean; message: string } => {
    const target = (state.payrollRecords || []).find((p) => p.id === id);
    if (!target) return { success: false, message: 'Payroll record not found.' };

    if (target.status === 'Approved' || target.status === 'Processed' || target.status === 'Paid') {
      return {
        success: false,
        message: `Cannot delete payroll in '${target.status}' status. Only Draft or Calculated payroll records can be deleted.`,
      };
    }

    setState((prev) => ({
      ...prev,
      payrollRecords: (prev.payrollRecords || []).filter((p) => p.id !== id),
    }));

    logActivity('Admin', `deleted payroll record ${target.employeeName} (${target.payPeriod}) - Reason: ${reason}`);
    return { success: true, message: `Payroll record for ${target.employeeName} deleted successfully.` };
  };

  const updatePayrollSettings = (newSettings: Partial<PayrollSettings>) => {
    setState((prev) => ({
      ...prev,
      payrollSettings: {
        ...(prev.payrollSettings || cleanInitialState.payrollSettings),
        ...newSettings,
      },
    }));
    logActivity('Admin', 'updated Payroll system settings');
  };

  // Reset & Seed Controls
  const clearAllData = () => {
    setState(cleanInitialState);
  };

  const loadSampleDemoData = () => {
    setState({
      company: {
        name: 'Infinitive Cloud Enterprise Solutions',
        logo: '',
        address: 'Tech Park B, Powai',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        timezone: 'Asia/Kolkata',
        currency: 'INR (₹)',
        workingDays: '5 Days (Mon - Fri)',
        contactEmail: 'hr@infinitivecloud.com',
        contactPhone: '+91 22 6789 0000',
      },
      adminUser: {
        name: 'Admin',
        email: 'admin@infinitivecloud.com',
        role: 'HR Administrator',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
        phone: '+91 22 6789 0000',
      },
      employees: mockEmployees,
      departments: mockDepartments,
      designations: mockDesignations,
      locations: mockLocations,
      attendance: mockAttendanceRecords,
      leaves: mockAdminLeaveRequests,
      leaveTypes: [
        { id: 'lt-1', name: 'Casual Leave (CL)', description: 'Casual time off', allowanceDays: 12, isPaid: true },
        { id: 'lt-2', name: 'Sick Leave (SL)', description: 'Medical sick leave', allowanceDays: 10, isPaid: true },
      ],
      holidays: mockHolidayEvents,
      announcements: mockAnnouncements,
      activities: mockRecentActivities,
      documents: mockEmployeeDocuments,
      jobs: mockJobOpenings,
      candidates: mockCandidates,
      performanceReviews: mockPerformanceReviews,
      salaryStructures: cleanInitialState.salaryStructures,
      salaryRules: cleanInitialState.salaryRules,
      salaryAssignments: cleanInitialState.salaryAssignments,
      employeeSalaryProfiles: {},
      payrollRecords: mockPayrollRecords,
      payrollSettings: cleanInitialState.payrollSettings,
      notifications: defaultInitialNotifications,
      notificationSettings: defaultNotificationSettings,
      isDemoData: true,
    });
  };

  // Derived Dynamic Statistics (NEVER hardcoded)
  const safeEmployees = Array.isArray(state.employees) ? state.employees : [];
  const totalEmployeesCount = safeEmployees.length;
  const activeEmployeesCount = safeEmployees.filter((e) => e.status === 'Active' || e.status === 'Probation').length;
  const onLeaveCount = safeEmployees.filter((e) => e.status === 'On Leave').length;

  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const newEmployeesCount = safeEmployees.filter((e) => {
    const join = new Date(e.joiningDate);
    return join >= sixtyDaysAgo;
  }).length;

  const safeState: EmsDataState = {
    ...state,
    company: state.company || cleanInitialState.company,
    adminUser: state.adminUser || cleanInitialState.adminUser,
    employees: safeEmployees,
    departments: Array.isArray(state.departments) ? state.departments : [],
    designations: Array.isArray(state.designations) ? state.designations : [],
    locations: Array.isArray(state.locations) ? state.locations : [],
    attendance: Array.isArray(state.attendance) ? state.attendance : [],
    leaves: Array.isArray(state.leaves) ? state.leaves : [],
    leaveTypes: Array.isArray(state.leaveTypes) ? state.leaveTypes : [],
    holidays: Array.isArray(state.holidays) ? state.holidays : [],
    announcements: Array.isArray(state.announcements) ? state.announcements : [],
    activities: Array.isArray(state.activities) ? state.activities : [],
    documents: Array.isArray(state.documents) ? state.documents : [],
    jobs: Array.isArray(state.jobs) ? state.jobs : [],
    candidates: Array.isArray(state.candidates) ? state.candidates : [],
    performanceReviews: Array.isArray(state.performanceReviews) ? state.performanceReviews : mockPerformanceReviews,
    salaryStructures: Array.isArray(state.salaryStructures) ? state.salaryStructures : cleanInitialState.salaryStructures,
    salaryRules: Array.isArray(state.salaryRules) ? state.salaryRules : cleanInitialState.salaryRules,
    notifications: Array.isArray(state.notifications) ? state.notifications : defaultInitialNotifications,
    notificationSettings: state.notificationSettings || defaultNotificationSettings,
  };

  const safeNotifications = safeState.notifications || [];
  const unreadNotificationsCount = safeNotifications.filter((n) => !n.isRead).length;

  return {
    state: safeState,
    isHydrated,
    totalEmployeesCount,
    activeEmployeesCount,
    onLeaveCount,
    newEmployeesCount,
    salaryAssignments: safeState.salaryAssignments,
    notifications: safeNotifications,
    notificationSettings: safeState.notificationSettings,
    unreadNotificationsCount,
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    updateNotificationSettings,
    testChannelConfig,
    addEmployee,
    deactivateEmployee,
    addDepartment,
    addDesignation,
    addHoliday,
    createAnnouncement,
    addLeaveType,
    updateLeaveRequestStatus,
    addDocument,
    addAttendanceRecord,
    addJobOpening,
    addCandidate,
    addPerformanceReview,
    updatePerformanceReview,
    deletePerformanceReview,
    addSalaryStructure,
    updateSalaryStructure,
    deleteSalaryStructure,
    addSalaryRule,
    updateSalaryRule,
    deleteSalaryRule,
    addSalaryAssignment,
    updateSalaryAssignment,
    deactivateSalaryAssignment,
    deleteSalaryAssignment,
    assignEmployeeSalaryProfile,
    processMonthlyPayroll,
    updatePayrollRecord,
    updatePayrollStatus,
    deletePayrollRecord,
    updatePayrollSettings,
    updateAdminProfile,
    importEmployees,
    clearAllData,
    clearSeedData: clearAllData,
    loadSampleDemoData,
    resetToDemoData: loadSampleDemoData,
  };
}

