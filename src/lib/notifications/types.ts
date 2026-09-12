export type RecipientType =
  | 'EMPLOYEE'
  | 'MANAGER'
  | 'HR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type TargetScope =
  | 'USER'
  | 'ROLE'
  | 'DEPARTMENT'
  | 'ORGANIZATION';

export type NotificationCategory =
  | 'HR_EMPLOYEE'
  | 'PAYROLL'
  | 'ATTENDANCE'
  | 'LEAVE'
  | 'RECRUITMENT'
  | 'DOCUMENT'
  | 'SYSTEM'
  | 'ANNOUNCEMENT';

export type NotificationPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export type NotificationChannel =
  | 'IN_APP'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'SMS'
  | 'PUSH';

export type NotificationStatus =
  | 'UNREAD'
  | 'READ'
  | 'SENT'
  | 'FAILED';

export interface NotificationDoc {
  _id?: any;
  id: string;
  eventId?: string;
  organizationId: string;
  recipientType?: RecipientType;
  recipientId?: string;
  targetScope?: TargetScope;
  targetId?: string;
  eventType: string;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  channel?: NotificationChannel;
  status: NotificationStatus;
  isRead?: boolean; // backwards compatibility helper
  actionUrl?: string;
  link?: string; // backwards compatibility helper
  metadata?: Record<string, any>;
  createdAt: string | Date;
  readAt?: string | Date | null;
  expiresAt?: string | Date | null;
  deletedAt?: string | Date | null;
  deletedBy?: string;
}

export interface NotificationPreferenceDoc {
  _id?: any;
  organizationId: string;
  userId?: string;
  eventType: string;
  category?: NotificationCategory;
  inApp: boolean;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
  enabled: boolean;
  updatedAt: string | Date;
}

export interface DeliveryLogDoc {
  _id?: any;
  organizationId: string;
  notificationId: string;
  recipientId?: string;
  channel: NotificationChannel;
  provider?: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  attemptedAt: string | Date;
  deliveredAt?: string | Date | null;
}

export interface RetentionPolicyDoc {
  _id?: any;
  organizationId: string;
  retentionDays: number; // 7, 30, 60, 90, 180, 365
  updatedAt: string | Date;
  updatedBy?: string;
}
