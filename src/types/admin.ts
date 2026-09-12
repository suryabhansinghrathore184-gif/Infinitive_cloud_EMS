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

export interface ProfilePhotoMeta {
  fileId?: string;
  mimeType?: string;
  fileName?: string;
  source: 'document-extraction' | 'manual-upload';
  uploadedAt: string;
  documentId?: string;
  documentType?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  photo?: string;
  profilePhoto?: ProfilePhotoMeta;
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
  status?: 'Active' | 'Inactive';
  description?: string;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  city: string;
  state?: string;
  country: string;
  address?: string;
  employeeCount: number;
  status?: 'Active' | 'Inactive';
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

export interface SalaryStructure {
  id: string;
  title: string;
  description: string;
  basicSalary: number;
  hraType: 'Fixed' | 'PercentBasic';
  hraValue: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  otherAllowances: number;
  pfPercent: number;
  ptAmount: number;
  tdsPercent: number;
  esiPercent: number;
  effectiveDate: string;
  status: 'Active' | 'Inactive';
}

export interface SalaryRule {
  id: string;
  name: string;
  code: string;
  type: 'Earning' | 'Deduction';
  calcType: 'Fixed Amount' | 'Percentage of Basic' | 'Percentage of Gross' | 'Formula';
  value: number | string;
  appliesTo: 'All Employees' | 'Department' | 'Designation' | 'Specific Employee';
  targetValue?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  description: string;
}

export interface SalaryHistoryRecord {
  id: string;
  effectiveDate: string;
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
  changedBy: string;
  changeReason: string;
  updatedAt: string;
}

export interface EmployeeSalaryAssignment {
  id: string; // Unique salaryAssignmentId e.g. "sal-assign-123"
  employeeId: string;
  employeeName: string;
  structureId?: string;
  structureTitle: string;
  effectiveDate: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  otherAllowances: number;
  bonus: number;
  pfEnabled: boolean;
  pfPercent: number;
  ptEnabled: boolean;
  ptAmount: number;
  tdsPercent: number;
  esiEnabled: boolean;
  esiPercent: number;
  status: 'Active' | 'Inactive';
  revisionReason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalaryProfile {
  employeeId: string;
  structureId?: string;
  structureTitle: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  otherAllowances: number;
  bonus: number;
  overtimeRatePerHour: number;
  pfEnabled: boolean;
  pfPercent: number;
  ptEnabled: boolean;
  ptAmount: number;
  tdsPercent: number;
  esiEnabled: boolean;
  esiPercent: number;
  effectiveDate: string;
  history: SalaryHistoryRecord[];
}

export type PayrollStatus =
  | 'Draft'
  | 'Calculated'
  | 'Pending Approval'
  | 'Approved'
  | 'Processed'
  | 'Paid'
  | 'Cancelled';

export interface PayrollAdjustment {
  date: string;
  user: string;
  originalNet: number;
  adjustedNet: number;
  reason: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  department: string;
  designation: string;
  joiningDate?: string;
  payPeriod: string; // e.g., "September 2026"
  payMonth: number; // 9
  payYear: number; // 2026
  
  // Attendance & Work Days
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeHours: number;
  overtimeRate: number;

  // Earnings Breakdown
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  otherAllowances: number;
  overtimePay: number;
  bonus: number;
  otherEarnings: number;
  grossSalary: number;

  // Deductions Breakdown
  lopDeduction: number;
  pfDeduction: number;
  ptDeduction: number;
  taxDeduction: number; // TDS
  esiDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  // Final Net
  netSalary: number;

  // Status & Audit
  status: PayrollStatus;
  notes?: string;
  adjustmentHistory?: PayrollAdjustment[];
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSettings {
  payCycle: string;
  workingDaysPerMonth: number;
  overtimeRatePerHour: number;
  pfDefaultPercent: number;
  ptDefaultAmount: number;
  tdsDefaultPercent: number;
  esiDefaultPercent: number;
  lopRule: 'Pro-rata Basic' | 'Pro-rata Gross' | 'Fixed Rate';
  payslipNumberFormat: string;
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

export type DocumentCategory =
  | 'Offer Letter'
  | 'Appointment Letter'
  | 'Identity Proof'
  | 'Payslip'
  | 'Resume'
  | 'Experience Letter'
  | 'Contract'
  | 'Other';

export type DocumentAccessRole =
  | 'HR Only'
  | 'Admin Only'
  | 'HR & Admin'
  | 'Employee'
  | 'Public';

export interface EmployeeDocument {
  id: string;
  title: string;
  employeeId: string;
  employeeName: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: string;
  fileSizeBytes?: number;
  mimeType?: string;
  fileId?: string;
  fileUrl?: string;
  accessRole: DocumentAccessRole;
  uploadedBy?: string;
  uploadDate: string;
  updatedAt?: string;
}

export interface JobOpening {
  id: string;
  organizationId?: string;
  jobTitle: string;
  slug?: string;
  department: string;
  location: string;
  type?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern' | 'Temporary';
  experience?: string;
  skills?: string[];
  openings: number;
  salary?: string;
  showSalaryPublicly?: boolean;
  shortDescription?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  applicationDeadline?: string;
  applicationMethod?: string;
  candidatesCount?: number;
  visibility?: 'Internal Only' | 'Public Website';
  status: 'Active' | 'Closed' | 'Draft' | 'Published' | 'Expired' | 'Archived';
  postedDate?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  organizationId?: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  resumeFileId?: string;
  resumeFileName?: string;
  coverLetter?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Technical Round' | 'Selected' | 'Offer' | 'Joined';
  appliedDate: string;
  rating: number;
  createdAt?: string;
}

export type HrTicketRequestType =
  | 'Salary Issue'
  | 'Attendance Correction'
  | 'Leave Issue'
  | 'Document Request'
  | 'Payroll Issue'
  | 'Profile Correction'
  | 'IT/Asset Request'
  | 'General HR Query';

export interface HrTicketComment {
  id: string;
  requestId: string;
  organizationId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  comment: string;
  isInternal: boolean;
  attachments?: MessageAttachment[];
  createdAt: string;
}

export interface HrTicketActivity {
  action: string;
  performedBy: string;
  timestamp: string;
}

export interface HrTicket {
  id: string;
  ticketNo: string;
  ticketNumber?: string;
  organizationId: string;
  employeeId: string;
  creatorName: string;
  creatorAvatar?: string;
  department?: string;
  email?: string;
  requestType: HrTicketRequestType;
  category?: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  assignedToId?: string;
  assignedToName?: string;
  assignedToAvatar?: string;
  assignee?: string;
  resolution?: string;
  attachments?: MessageAttachment[];
  history?: HrTicketActivity[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
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

// Notification System Models
export type NotificationCategory =
  | 'employee'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'document'
  | 'recruitment'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export interface AppNotification {
  id: string;
  recipientId: string;
  recipientRole: 'Admin' | 'Employee' | 'HR';
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  entityType?: 'employee' | 'leave' | 'attendance' | 'payroll' | 'document' | 'candidate' | 'job' | 'system';
  entityId?: string;
  actionUrl: string;
  isRead: boolean;
  readAt?: string;
  deliveryStatus: NotificationDeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: string;
  eventKey: string;
  eventName: string;
  category: NotificationCategory;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export interface SmtpConfig {
  configured: boolean;
  host: string;
  port: number;
  username: string;
  fromName: string;
  fromEmail: string;
  useTls: boolean;
}

export interface SmsConfig {
  configured: boolean;
  provider: string;
  senderId: string;
  apiKeySet: boolean;
}

export interface WhatsappConfig {
  configured: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  tokenSet: boolean;
}

export interface NotificationSettingsState {
  retentionDays: '30' | '90' | '180' | '365' | 'never';
  smtp: SmtpConfig;
  sms: SmsConfig;
  whatsapp: WhatsappConfig;
  preferences: NotificationPreference[];
}

export interface MessageAttachment {
  fileId: string;
  fileName: string;
  fileSize?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  fileUrl: string;
}

export interface InternalMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  senderId: string;
  senderRole: 'HR' | 'Admin' | 'Employee' | 'SUPER_ADMIN' | 'MANAGER' | string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  message: string;
  attachments?: MessageAttachment[];
  readAt?: string | null;
  createdAt: string;
}

export interface ConversationThread {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  employeeEmail?: string;
  department?: string;
  subject: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCountHr: number;
  unreadCountEmployee: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


