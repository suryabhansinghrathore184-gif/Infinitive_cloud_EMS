import { connectToDatabase } from '@/lib/mongodb';
import {
  NotificationDoc,
  NotificationCategory,
  NotificationPriority,
  RecipientType,
  TargetScope,
  NotificationChannel,
} from './types';
import { getNotificationPreferences } from './notificationPreferences';
import { dispatchMultiChannelNotification } from './notificationDispatcher';

export interface CreateNotificationOptions {
  organizationId: string;
  recipientType?: RecipientType;
  recipientId?: string;
  targetScope?: TargetScope;
  targetId?: string;
  eventType: string;
  category: NotificationCategory;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
  recipientEmail?: string;
  recipientPhone?: string;
}

/**
 * Central Server-Side Function to Create & Dispatch Notifications across EMS Modules.
 */
export async function createNotification(
  options: CreateNotificationOptions
): Promise<NotificationDoc> {
  const {
    organizationId,
    recipientType = 'EMPLOYEE',
    recipientId,
    targetScope = 'USER',
    targetId,
    eventType,
    category,
    title,
    message,
    priority = 'NORMAL',
    actionUrl,
    metadata,
    recipientEmail,
    recipientPhone,
  } = options;

  if (!organizationId) {
    throw new Error('organizationId is required to create a notification');
  }

  const nowISO = new Date().toISOString();
  const { db } = await connectToDatabase();

  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const notifDoc: NotificationDoc = {
    id: notifId,
    organizationId,
    recipientType,
    recipientId: recipientId || 'usr-admin-1',
    targetScope,
    targetId: targetId || recipientId || undefined,
    eventType,
    category,
    title,
    message,
    priority,
    channel: 'IN_APP',
    status: 'UNREAD',
    isRead: false,
    actionUrl: actionUrl || undefined,
    link: actionUrl || undefined,
    metadata: metadata || {},
    createdAt: nowISO,
    readAt: null,
    expiresAt: null,
    deletedAt: null,
  };

  // Insert IN_APP notification record into MongoDB
  await db.collection('notifications').insertOne(notifDoc);

  // Evaluate recipient preferences & multi-channel dispatch
  try {
    const preferences = await getNotificationPreferences(organizationId, recipientId);
    const pref = preferences.find((p) => p.eventType === eventType);

    const activeChannels: NotificationChannel[] = ['IN_APP'];
    if (pref && pref.enabled !== false) {
      if (pref.email) activeChannels.push('EMAIL');
      if (pref.whatsapp) activeChannels.push('WHATSAPP');
      if (pref.sms) activeChannels.push('SMS');
      if (pref.push) activeChannels.push('PUSH');
    }

    // Dispatch background channels (non-blocking)
    if (activeChannels.length > 1) {
      dispatchMultiChannelNotification({
        notification: notifDoc,
        channels: activeChannels,
        recipientPhone,
        recipientEmail,
      }).catch((err) => console.error('Error dispatching multi-channel notification:', err));
    }
  } catch (err) {
    console.error('Error checking notification preferences:', err);
  }

  return notifDoc;
}
