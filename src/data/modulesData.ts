import {
  PayrollRecord,
  PerformanceReview,
  EmployeeDocument,
  JobOpening,
  Candidate,
  HrTicket,
  AuditLogItem,
  IntegrationCard,
} from '@/types/admin';

export const mockPayrollRecords: PayrollRecord[] = [];

export const mockPerformanceReviews: PerformanceReview[] = [];

export const mockEmployeeDocuments: EmployeeDocument[] = [];

export const mockJobOpenings: JobOpening[] = [];

export const mockCandidates: Candidate[] = [];

export const mockHrTickets: HrTicket[] = [];

export const mockAuditLogs: AuditLogItem[] = [];

export const mockIntegrationCards: IntegrationCard[] = [
  {
    id: 'integ-1',
    name: 'WhatsApp Business API',
    category: 'Messaging & Alerts',
    description: 'Send instant payslip notifications, leave approvals, and announcements via WhatsApp.',
    iconName: 'MessageCircle',
    isConnected: false,
    statusText: 'Not Configured',
  },
  {
    id: 'integ-2',
    name: 'Biometric Attendance Gateway',
    category: 'Hardware Integration',
    description: 'Sync ZKTeco / Matrix biometric punch logs automatically.',
    iconName: 'Fingerprint',
    isConnected: false,
    statusText: 'Not Configured',
  },
  {
    id: 'integ-3',
    name: 'Microsoft 365 / Teams',
    category: 'Enterprise Suite',
    description: 'Sync company calendar events, holiday notices, and employee directory with MS Teams.',
    iconName: 'Building',
    isConnected: false,
    statusText: 'Not Configured',
  },
  {
    id: 'integ-4',
    name: 'MongoDB GridFS Storage Driver',
    category: 'Document Storage',
    description: 'Secure, encrypted document and photo storage directly inside MongoDB database.',
    iconName: 'Cloud',
    isConnected: true,
    statusText: 'Connected (Bucket: photos)',
  },
];
