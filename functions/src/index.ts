import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

admin.initializeApp();
const db = admin.firestore();

function getIsraelHHMM(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
}

// Runs every 5 minutes and sends FCM push notifications when scheduled time is reached
export const sendPlantNotifications = onSchedule(
  { schedule: '*/5 * * * *', timeZone: 'Asia/Jerusalem' },
  async () => {
    const settingsRef = db.doc('settings/general');
    const snap = await settingsRef.get();
    if (!snap.exists) return;

    const notifs = snap.data()?.notifications as {
      enabled?: boolean;
      time?: string;
      snoozeInterval?: string;
      fcmToken?: string;
      lastNotifiedAt?: admin.firestore.Timestamp;
      nextNotifyAt?: admin.firestore.Timestamp | null;
    } | undefined;

    if (!notifs?.enabled || !notifs?.fcmToken) return;

    const now = new Date();
    const nowMs = now.getTime();
    const currentHHMM = getIsraelHHMM(now);

    let shouldSend = false;

    // Snooze: nextNotifyAt has passed
    if (notifs.nextNotifyAt && nowMs >= notifs.nextNotifyAt.toMillis()) {
      shouldSend = true;
    }

    // Daily scheduled time matches and we haven't sent in the last 10 minutes
    if (!shouldSend && currentHHMM === notifs.time) {
      const lastMs = notifs.lastNotifiedAt?.toMillis() ?? 0;
      if (nowMs - lastMs > 10 * 60 * 1000) {
        shouldSend = true;
      }
    }

    if (!shouldSend) return;

    try {
      await admin.messaging().send({
        token: notifs.fcmToken,
        notification: {
          title: 'הגיע הזמן להשקות! 💧',
          body: 'הצמחים שלך מחכים להשקיה',
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            requireInteraction: true,
          },
          fcmOptions: { link: '/' },
        },
      });

      // Compute next snooze time
      let nextNotifyAt: admin.firestore.Timestamp | null = null;
      const snooze = notifs.snoozeInterval;
      if (snooze && snooze !== 'ללא') {
        let offsetMs = 0;
        if (snooze === 'שעה') offsetMs = 60 * 60 * 1000;
        else if (snooze === 'שלוש שעות') offsetMs = 3 * 60 * 60 * 1000;
        else if (snooze === 'יום למחרת') offsetMs = 24 * 60 * 60 * 1000;

        if (offsetMs > 0) {
          nextNotifyAt = admin.firestore.Timestamp.fromMillis(nowMs + offsetMs);
        }
      }

      await settingsRef.update({
        'notifications.lastNotifiedAt': admin.firestore.FieldValue.serverTimestamp(),
        'notifications.nextNotifyAt': nextNotifyAt,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'messaging/registration-token-not-registered') {
        // Token is stale — clear it so the client re-registers on next open
        await settingsRef.update({ 'notifications.fcmToken': null });
      } else {
        console.error('[sendPlantNotifications] FCM send error:', e);
      }
    }
  }
);
