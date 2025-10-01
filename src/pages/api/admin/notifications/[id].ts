// src/pages/api/admin/notifications/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '@/lib/rbac';
import { User } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { NotificationSchedule } from './index';

async function handler(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  if (req.method === 'PUT') {
    return updateNotification(req, res, id, user);
  }
  if (req.method === 'DELETE') {
    return deleteNotification(req, res, id, user);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

// PUT /api/admin/notifications/[id]
async function updateNotification(
  req: NextApiRequest,
  res: NextApiResponse,
  notificationId: string,
  user: User,
) {
  const { title, message, type, recipients, specificRecipients, isActive } = req.body;

  try {
    const notifications = storage.load('notificationSchedules', []) as NotificationSchedule[];
    const notificationIndex = notifications.findIndex((n) => n.id === notificationId);

    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const existingNotification = notifications[notificationIndex];

    // Update fields
    if (title) existingNotification.title = title;
    if (message) existingNotification.message = message;
    if (type) existingNotification.type = type;
    if (recipients) existingNotification.recipients = recipients;
    if (specificRecipients) existingNotification.specificRecipients = specificRecipients;
    if (typeof isActive === 'boolean') existingNotification.isActive = isActive;

    notifications[notificationIndex] = existingNotification;
    storage.save('notificationSchedules', notifications);

    // Log update
    logAuditEvent({
      action: 'NOTIFICATION_UPDATED',
      performedBy: user.id,
      performedByName: user.name,
      details: { notificationId, title: existingNotification.title },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      notification: existingNotification,
      message: 'Notification updated successfully',
    });
  } catch (error) {
    console.error('Update notification error:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
}

// DELETE /api/admin/notifications/[id]
async function deleteNotification(
  req: NextApiRequest,
  res: NextApiResponse,
  notificationId: string,
  user: User,
) {
  try {
    const notifications = storage.load('notificationSchedules', []) as NotificationSchedule[];
    const notificationIndex = notifications.findIndex((n) => n.id === notificationId);

    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const deletedNotification = notifications[notificationIndex];
    notifications.splice(notificationIndex, 1);
    storage.save('notificationSchedules', notifications);

    // Log deletion
    logAuditEvent({
      action: 'NOTIFICATION_DELETED',
      performedBy: user.id,
      performedByName: user.name,
      details: { notificationId, title: deletedNotification.title },
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      message: 'Notification deleted successfully',
      notification: deletedNotification,
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
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
