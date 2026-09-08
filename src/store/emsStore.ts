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
} from '@/types/admin';
import { HolidayEvent } from '@/types/dashboard';
import { mockEmployees, mockDepartments, mockDesignations, mockLocations } from '@/data/employees';
import { mockAttendanceRecords, mockAdminLeaveRequests } from '@/data/attendance';
import { mockHolidayEvents, mockAnnouncements, mockRecentActivities } from '@/data/dashboard';
import { mockEmployeeDocuments } from '@/data/modulesData';

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

export interface EmsDataState {
  company: CompanyInfo;
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
  isDemoData: false,
};

export function getInitialEmsState(): EmsDataState {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved EMS data state', e);
      }
    }
  }
  return cleanInitialState;
}

export function useEmsStore() {
  const [state, setState] = useState<EmsDataState>(getInitialEmsState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

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

  // 6. ADD LEAVE TYPE
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
      isDemoData: true,
    });
  };

  // Derived Dynamic Statistics (NEVER hardcoded)
  const totalEmployeesCount = state.employees.length;
  const activeEmployeesCount = state.employees.filter((e) => e.status === 'Active' || e.status === 'Probation').length;
  const onLeaveCount = state.employees.filter((e) => e.status === 'On Leave').length;

  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const newEmployeesCount = state.employees.filter((e) => {
    const join = new Date(e.joiningDate);
    return join >= sixtyDaysAgo;
  }).length;

  return {
    state,
    totalEmployeesCount,
    activeEmployeesCount,
    onLeaveCount,
    newEmployeesCount,
    addEmployee,
    deactivateEmployee,
    addDepartment,
    addDesignation,
    addHoliday,
    createAnnouncement,
    addLeaveType,
    addDocument,
    importEmployees,
    clearAllData,
    clearSeedData: clearAllData,
    loadSampleDemoData,
    resetToDemoData: loadSampleDemoData,
  };
}

