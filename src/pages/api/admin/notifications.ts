// src/pages/api/admin/notifications.ts
import { scheduleJob } from 'node-schedule';
import webpush from 'web-push';

// Configure web push
webpush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// POST /api/admin/notifications/schedule
export async function scheduleNotification(req: NextApiRequest, res: NextApiResponse) {
  const { type, recipients, schedule, template } = req.body;

  try {
    const notification: NotificationSchedule = {
      id: Date.now().toString(),
      type,
      recipient: recipients,
      schedule,
      template,
      active: true,
      nextScheduled: calculateNextSchedule(schedule),
    };

    const notifications = storage.load('notification_schedules', []);
    notifications.push(notification);
    storage.save('notification_schedules', notifications);

    // Schedule the job
    const cronPattern = getCronPattern(schedule);
    scheduleJob(notification.id, cronPattern, async () => {
      await sendScheduledNotification(notification);
    });

    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule notification' });
  }
}

// Helper function to send notifications
async function sendScheduledNotification(notification: NotificationSchedule) {
  const users = storage.load('users', []);
  const recipients =
    notification.recipient === 'all' ? users : users.filter((u) => u.id === notification.recipient);

  for (const user of recipients) {
    // Send email notification
    if (notification.type === 'email' || notification.type === 'both') {
      if (user.email && user.notificationPreferences?.email) {
        await sendEmail({
          to: user.email,
          subject: notification.template.subject,
          body: replaceVariables(notification.template.body, user),
        });
      }
    }

    // Send push notification
    if (notification.type === 'push' || notification.type === 'both') {
      if (user.pushSubscription && user.notificationPreferences?.push) {
        await webpush.sendNotification(
          user.pushSubscription,
          JSON.stringify({
            title: notification.template.subject,
            body: replaceVariables(notification.template.body, user),
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            url: '/inspections',
          }),
        );
      }
    }
  }

  // Update last sent time
  const notifications = storage.load('notification_schedules', []);
  const index = notifications.findIndex((n) => n.id === notification.id);
  if (index !== -1) {
    notifications[index].lastSent = new Date();
    notifications[index].nextScheduled = calculateNextSchedule(notification.schedule);
    storage.save('notification_schedules', notifications);
  }
}
