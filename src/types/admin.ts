// Comprehensive TypeScript interfaces for Admin/HR Panel

export type EmploymentStatus =
  | 'Active'
  | 'Probation'
  | 'On Leave'
  | 'Suspended'
  | 'Resigned'
  | 'Terminated'
  | 'Former Employee';

export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Intern'
  | 'Temporary';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
  country: string;

  // Employment
  department: string;
  designation: string;
  manager: string;
  location: string;
  employmentType: EmploymentType;
  joiningDate: string;
  status: EmploymentStatus;
  shift: string;
  grade: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyAddress: string;

  // Sensitive Details (Restricted Access)
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  panNumber: string;
  aadhaarNo: string;
  passportNo: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  employeeCount: number;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface Designation {
  id: string;
  title: string;
  code: string;
  department: string;
  level: string;
  employeeCount: number;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  employeeCount: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  date: string;
  checkIn: string;
  checkOut: string;
  breakDuration: string;
  workingHours: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Early Leave' | 'Work From Home' | 'On Leave';
  method: 'Web' | 'Mobile' | 'Biometric' | 'RFID' | 'GPS';
  location: string;
}

export interface LeaveRequestAdmin {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  requestedDate: string;
  approver: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Clarification';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  department: string;
  designation: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  overtimePay: number;
  grossSalary: number;
  pfDeduction: number;
  ptDeduction: number;
  taxDeduction: number;
  netSalary: number;
  status: 'Draft' | 'Processing' | 'Approved' | 'Disbursed';
  payPeriod: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  department: string;
  cycle: string;
  selfRating: number;
  managerRating: number;
  finalRating: number;
  status: 'Goal Setting' | 'Self Review' | 'Manager Review' | 'Completed';
  pipStatus?: 'Active' | 'None';
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  category: 'Offer Letter' | 'Appointment Letter' | 'ID Proof' | 'Certificate' | 'Salary Slip' | 'Experience Letter';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  expiryDate?: string;
  accessRole: 'HR Only' | 'Employee & HR' | 'Public';
}

export interface JobOpening {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  type: string;
  openings: number;
  candidatesCount: number;
  status: 'Active' | 'Closed' | 'Draft';
  postedDate: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Technical Round' | 'Selected' | 'Offer' | 'Joined';
  appliedDate: string;
  rating: number;
}

export interface HrTicket {
  id: string;
  ticketNo: string;
  creatorName: string;
  avatar: string;
  category: 'Salary issue' | 'Attendance correction' | 'Leave issue' | 'Document request' | 'Payroll issue' | 'IT/asset request' | 'General HR query';
  subject: string;
  assignee: string;
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  user: string;
  userRole: string;
  action: string;
  module: string;
  entity: string;
  targetEmployee?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  ipAddress: string;
}

export interface IntegrationCard {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  isConnected: boolean;
  statusText: string;
}

export type { RecentActivityItem, AnnouncementItem } from './dashboard';

