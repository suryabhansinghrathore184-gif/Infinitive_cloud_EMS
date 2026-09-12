import { connectToDatabase } from '@/lib/mongodb';
import { NotificationPreferenceDoc, NotificationCategory } from './types';

export const DEFAULT_EVENT_MATRIX: Array<{
  eventType: string;
  eventName: string;
  category: NotificationCategory;
  inApp: boolean;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
}> = [
  // EMPLOYEE
  { eventType: 'employee_created', eventName: 'New Employee Added', category: 'HR_EMPLOYEE', inApp: true, email: true, whatsapp: false, sms: false },
  { eventType: 'employee_updated', eventName: 'Employee Profile Updated', category: 'HR_EMPLOYEE', inApp: true, email: false, whatsapp: false, sms: false },
  { eventType: 'employee_deactivated', eventName: 'Employee Deactivated', category: 'HR_EMPLOYEE', inApp: true, email: true, whatsapp: false, sms: false },

  // PAYROLL
  { eventType: 'payroll_calculated', eventName: 'Monthly Payroll Calculated', category: 'PAYROLL', inApp: true, email: true, whatsapp: false, sms: false },
  { eventType: 'payroll_approved', eventName: 'Payroll Approved', category: 'PAYROLL', inApp: true, email: true, whatsapp: true, sms: false },
  { eventType: 'payslip_generated', eventName: 'Payslip Available for Download', category: 'PAYROLL', inApp: true, email: true, whatsapp: true, sms: false },

  // LEAVE
  { eventType: 'leave_submitted', eventName: 'New Leave Request Submitted', category: 'LEAVE', inApp: true, email: true, whatsapp: false, sms: false },
  { eventType: 'leave_approved', eventName: 'Leave Request Approved', category: 'LEAVE', inApp: true, email: true, whatsapp: true, sms: false },
  { eventType: 'leave_rejected', eventName: 'Leave Request Rejected', category: 'LEAVE', inApp: true, email: true, whatsapp: false, sms: false },

  // ATTENDANCE
  { eventType: 'attendance_reminder', eventName: 'Daily Attendance Punch Reminder', category: 'ATTENDANCE', inApp: true, email: false, whatsapp: true, sms: false },
  { eventType: 'attendance_correction', eventName: 'Attendance Correction Request', category: 'ATTENDANCE', inApp: true, email: false, whatsapp: false, sms: false },

  // RECRUITMENT
  { eventType: 'candidate_applied', eventName: 'New Candidate Applied', category: 'RECRUITMENT', inApp: true, email: false, whatsapp: false, sms: false },
  { eventType: 'interview_scheduled', eventName: 'Interview Scheduled', category: 'RECRUITMENT', inApp: true, email: true, whatsapp: false, sms: false },

  // DOCUMENT
  { eventType: 'document_uploaded', eventName: 'Employee Document Uploaded', category: 'DOCUMENT', inApp: true, email: false, whatsapp: false, sms: false },
  { eventType: 'document_expiry', eventName: 'Document Expiry Alert', category: 'DOCUMENT', inApp: true, email: true, whatsapp: false, sms: false },

  // HR & HELPDESK
  { eventType: 'hr_ticket_created', eventName: 'New HR Support Ticket Created', category: 'HR_EMPLOYEE', inApp: true, email: true, whatsapp: false, sms: false },
  { eventType: 'hr_ticket_resolved', eventName: 'HR Support Ticket Resolved', category: 'HR_EMPLOYEE', inApp: true, email: true, whatsapp: true, sms: false },
  { eventType: 'hr_message_received', eventName: 'New Private Message from HR', category: 'HR_EMPLOYEE', inApp: true, email: true, whatsapp: false, sms: false },

  // SYSTEM
  { eventType: 'system_alert', eventName: 'System Security & Diagnostic Alert', category: 'SYSTEM', inApp: true, email: true, whatsapp: false, sms: false },
  { eventType: 'integration_failure', eventName: 'Third-Party Gateway Integration Failure', category: 'SYSTEM', inApp: true, email: true, whatsapp: false, sms: false },
];

export async function getNotificationPreferences(
  organizationId: string,
  userId?: string
): Promise<NotificationPreferenceDoc[]> {
  const { db } = await connectToDatabase();
  const query: any = { organizationId };
  if (userId) query.userId = userId;

  const existingPrefs = await db
    .collection('notification_preferences')
    .find(query)
    .toArray();

  const prefMap = new Map<string, any>();
  existingPrefs.forEach((p) => prefMap.set(p.eventType, p));

  // Merge with defaults if missing
  const merged: NotificationPreferenceDoc[] = DEFAULT_EVENT_MATRIX.map((def) => {
    const found = prefMap.get(def.eventType);
    if (found) {
      return {
        organizationId,
        userId,
        eventType: def.eventType,
        category: def.category,
        inApp: found.inApp !== false,
        email: Boolean(found.email),
        whatsapp: Boolean(found.whatsapp),
        sms: Boolean(found.sms),
        push: Boolean(found.push),
        enabled: found.enabled !== false,
        updatedAt: found.updatedAt || new Date().toISOString(),
      };
    }
    return {
      organizationId,
      userId,
      eventType: def.eventType,
      category: def.category,
      inApp: def.inApp,
      email: def.email,
      whatsapp: def.whatsapp,
      sms: def.sms,
      push: false,
      enabled: true,
      updatedAt: new Date().toISOString(),
    };
  });

  return merged;
}

export async function updateNotificationPreference(
  organizationId: string,
  preference: Partial<NotificationPreferenceDoc> & { eventType: string },
  userId?: string
): Promise<boolean> {
  const { db } = await connectToDatabase();
  const nowISO = new Date().toISOString();

  const filter: any = { organizationId, eventType: preference.eventType };
  if (userId) filter.userId = userId;

  const updateDoc = {
    $set: {
      organizationId,
      userId: userId || null,
      eventType: preference.eventType,
      category: preference.category,
      inApp: preference.inApp !== false,
      email: Boolean(preference.email),
      whatsapp: Boolean(preference.whatsapp),
      sms: Boolean(preference.sms),
      push: Boolean(preference.push),
      enabled: preference.enabled !== false,
      updatedAt: nowISO,
    },
  };

  await db
    .collection('notification_preferences')
    .updateOne(filter, updateDoc, { upsert: true });

  return true;
}
