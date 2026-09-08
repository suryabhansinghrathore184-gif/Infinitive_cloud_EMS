'use client';

import { useState, useEffect } from 'react';
import {
  Employee,
  Department,
  Designation,
  Location,
  AttendanceRecord,
  LeaveRequestAdmin,
} from '@/types/admin';
import { HolidayEvent } from '@/types/dashboard';
import { mockEmployees, mockDepartments, mockDesignations, mockLocations } from '@/data/employees';
import { mockAttendanceRecords, mockAdminLeaveRequests } from '@/data/attendance';
import { mockHolidayEvents } from '@/data/dashboard';

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
  isDemo: boolean;
}

const defaultCompanyInfo: CompanyInfo = {
  name: 'Infinitive Cloud Enterprise Solutions',
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=80',
  address: 'Tech Park Tower B, 5th Floor, Powai',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  timezone: 'Asia/Kolkata (IST +05:30)',
  currency: 'INR (₹)',
  workingDays: '5 Days (Monday - Friday)',
  contactEmail: 'hr@infinitivecloud.com',
  contactPhone: '+91 22 6789 0000',
  isDemo: true,
};

const STORAGE_KEY = 'ems_hrms_master_data_v1';

export interface EmsDataState {
  company: CompanyInfo;
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  locations: Location[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequestAdmin[];
  holidays: HolidayEvent[];
  isDemoData: boolean;
}

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

  return {
    company: defaultCompanyInfo,
    employees: mockEmployees,
    departments: mockDepartments,
    designations: mockDesignations,
    locations: mockLocations,
    attendance: mockAttendanceRecords,
    leaves: mockAdminLeaveRequests,
    holidays: mockHolidayEvents,
    isDemoData: true,
  };
}

export function useEmsStore() {
  const [state, setState] = useState<EmsDataState>(getInitialEmsState);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

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
    }));

    return { success: true, message: `Employee ${created.firstName} ${created.lastName} (${created.employeeId}) created successfully!` };
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    }));
  };

  const deactivateEmployee = (id: string) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === id ? { ...e, status: 'Terminated' as const } : e
      ),
    }));
  };

  const importEmployees = (
    incoming: Omit<Employee, 'id'>[]
  ): { added: number; skippedDuplicates: number; message: string } => {
    let addedCount = 0;
    let duplicateCount = 0;
    const newItems: Employee[] = [];

    const existingIds = new Set(state.employees.map((e) => e.employeeId.trim().toLowerCase()));

    incoming.forEach((item, index) => {
      const idKey = item.employeeId.trim().toLowerCase();
      if (existingIds.has(idKey)) {
        duplicateCount++;
      } else {
        existingIds.add(idKey);
        addedCount++;
        newItems.push({
          ...item,
          id: `emp-imp-${Date.now()}-${index}`,
        });
      }
    });

    if (newItems.length > 0) {
      setState((prev) => ({
        ...prev,
        employees: [...newItems, ...prev.employees],
      }));
    }

    return {
      added: addedCount,
      skippedDuplicates: duplicateCount,
      message: `Successfully imported ${addedCount} new employees (${duplicateCount} duplicate IDs skipped).`,
    };
  };

  const addDepartment = (dept: Omit<Department, 'id' | 'employeeCount'>) => {
    const created: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
      employeeCount: 0,
    };
    setState((prev) => ({
      ...prev,
      departments: [...prev.departments, created],
    }));
  };

  const addHoliday = (holiday: Omit<HolidayEvent, 'id'>) => {
    const created: HolidayEvent = {
      ...holiday,
      id: `hol-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      holidays: [...prev.holidays, created],
    }));
  };

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    setState((prev) => ({
      ...prev,
      company: { ...prev.company, ...info, isDemo: false },
    }));
  };

  const clearSeedData = () => {
    setState({
      company: {
        name: 'New Company Name',
        logo: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        timezone: 'Asia/Kolkata (IST +05:30)',
        currency: 'INR (₹)',
        workingDays: '5 Days (Monday - Friday)',
        contactEmail: 'admin@company.com',
        contactPhone: '',
        isDemo: false,
      },
      employees: [],
      departments: [],
      designations: [],
      locations: [],
      attendance: [],
      leaves: [],
      holidays: [],
      isDemoData: false,
    });
  };

  const resetToDemoData = () => {
    const defaultState: EmsDataState = {
      company: defaultCompanyInfo,
      employees: mockEmployees,
      departments: mockDepartments,
      designations: mockDesignations,
      locations: mockLocations,
      attendance: mockAttendanceRecords,
      leaves: mockAdminLeaveRequests,
      holidays: mockHolidayEvents,
      isDemoData: true,
    };
    setState(defaultState);
  };

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
    updateEmployee,
    deactivateEmployee,
    importEmployees,
    addDepartment,
    addHoliday,
    updateCompanyInfo,
    clearSeedData,
    resetToDemoData,
  };
}
