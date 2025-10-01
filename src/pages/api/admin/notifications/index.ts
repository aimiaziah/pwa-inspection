// src/pages/api/admin/notifications/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';

export interface NotificationSchedule {
  id: string;
  title: string;
  message: string;
  type: 'email' | 'push' | 'both';
  recipients: 'all' | 'inspectors' | 'specific';
  specificRecipients?: string[]; // User IDs
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  scheduleDate?: string; // For 'once' type
  scheduledDay?: number; // Day of month for 'monthly', day of week for 'weekly'
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastSent?: string;
  nextScheduled?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  if (req.method === 'GET') {
    return getNotifications(req, res);
  }
  if (req.method === 'POST') {
    return createNotification(req, res, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// GET /api/admin/notifications
async function getNotifications(req: NextApiRequest, res: NextApiResponse) {
  try {
    const notifications = storage.load('notificationSchedules', []) as NotificationSchedule[];

    return res.status(200).json({
      notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

// POST /api/admin/notifications
async function createNotification(req: NextApiRequest, res: NextApiResponse, user: User) {
  const {
    title,
    message,
    type,
    recipients,
    specificRecipients,
    frequency,
    scheduleDate,
    scheduledDay,
  } = req.body;

  try {
    if (!title || !message || !type || !recipients || !frequency) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'message', 'type', 'recipients', 'frequency'],
      });
    }

    // Validate type
    if (!['email', 'push', 'both'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type', validTypes: ['email', 'push', 'both'] });
    }

    // Validate frequency
    if (!['once', 'daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        error: 'Invalid frequency',
        validFrequencies: ['once', 'daily', 'weekly', 'monthly'],
      });
    }

    // Validate recipients
    if (!['all', 'inspectors', 'specific'].includes(recipients)) {
      return res.status(400).json({
        error: 'Invalid recipients',
        validRecipients: ['all', 'inspectors', 'specific'],
      });
    }

    if (recipients === 'specific' && (!specificRecipients || specificRecipients.length === 0)) {
      return res.status(400).json({
        error: 'specificRecipients required when recipients is "specific"',
      });
    }

    const newNotification: NotificationSchedule = {
      id: Date.now().toString(),
      title,
      message,
      type,
      recipients,
      specificRecipients: recipients === 'specific' ? specificRecipients : undefined,
      frequency,
      scheduleDate: frequency === 'once' ? scheduleDate : undefined,
      scheduledDay,
      isActive: true,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      nextScheduled: calculateNextSchedule(frequency, scheduleDate, scheduledDay),
    };

    const notifications = storage.load('notificationSchedules', []) as NotificationSchedule[];
    notifications.push(newNotification);
    storage.save('notificationSchedules', notifications);

    // Log notification creation
    logAuditEvent({
      action: 'NOTIFICATION_SCHEDULED',
      performedBy: user.id,
      performedByName: user.name,
      details: {
        notificationId: newNotification.id,
        title: newNotification.title,
        frequency: newNotification.frequency,
      },
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      notification: newNotification,
      message: 'Notification scheduled successfully',
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
}

// Calculate next scheduled date based on frequency
function calculateNextSchedule(
  frequency: string,
  scheduleDate?: string,
  scheduledDay?: number,
): string {
  const now = new Date();

  switch (frequency) {
    case 'once':
      return scheduleDate || now.toISOString();

    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM next day
      return tomorrow.toISOString();

    case 'weekly':
      const nextWeek = new Date(now);
      const targetDay = scheduledDay || 1; // Monday by default
      const daysUntilTarget = (targetDay - now.getDay() + 7) % 7 || 7;
      nextWeek.setDate(nextWeek.getDate() + daysUntilTarget);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek.toISOString();

    case 'monthly':
      const nextMonth = new Date(now);
      const targetDate = scheduledDay || 1; // 1st of month by default
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(targetDate);
      nextMonth.setHours(9, 0, 0, 0);
      return nextMonth.toISOString();

    default:
      return now.toISOString();
  }
}

function logAuditEvent(event: any) {
  const auditLogs = storage.load('auditLogs', []);
  auditLogs.push(event);

  if (auditLogs.length > 50000) {
    auditLogs.splice(0, auditLogs.length - 50000);
  }

  storage.save('auditLogs', auditLogs);
}

export default withRBAC(handler, {
  requiredRole: 'admin',
  requiredPermission: 'canSetNotifications',
});
