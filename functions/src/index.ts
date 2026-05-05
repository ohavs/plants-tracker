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

// Returns "YYYY-MM-DD" in Israel timezone without relying on locale formatting
function getIsraelDateStr(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value ?? '';
  const m = parts.find(p => p.type === 'month')?.value ?? '';
  const d = parts.find(p => p.type === 'day')?.value ?? '';
  return `${y}-${m}-${d}`;
}

export const sendPlantNotifications = onSchedule(
  { schedule: '*/5 * * * *', timeZone: 'Asia/Jerusalem' },
  async () => {
    const settingsRef = db.doc('settings/general');
    const snap = await settingsRef.get();
    if (!snap.exists) {
      console.log('[sendPlantNotifications] settings/general not found');
      return;
    }

    const notifs = snap.data()?.notifications as {
      enabled?: boolean;
      time?: string;
      snoozeInterval?: string;
      fcmToken?: string;
      lastNotifiedAt?: admin.firestore.Timestamp;
      nextNotifyAt?: admin.firestore.Timestamp | null;
    } | undefined;

    if (!notifs?.enabled) {
      console.log('[sendPlantNotifications] notifications disabled');
      return;
    }
    if (!notifs?.fcmToken) {
      console.log('[sendPlantNotifications] no fcmToken — waiting for client to re-register');
      return;
    }

    const now = new Date();
    const nowMs = now.getTime();
    const currentHHMM = getIsraelHHMM(now);
    const todayStr = getIsraelDateStr(now);

    const lastMs = notifs.lastNotifiedAt?.toMillis() ?? 0;
    const minsSinceLast = Math.round((nowMs - lastMs) / 60000);

    // Fast early exit: skip if sent in the last 10 minutes
    if (nowMs - lastMs < 10 * 60 * 1000) {
      console.log(`[sendPlantNotifications] dedup: sent ${minsSinceLast}m ago, skipping`);
      return;
    }

    let shouldSend = false;
    let reason = '';

    // 1. Snooze: nextNotifyAt has passed
    if (notifs.nextNotifyAt && nowMs >= notifs.nextNotifyAt.toMillis()) {
      shouldSend = true;
      reason = `snooze (nextNotifyAt=${new Date(notifs.nextNotifyAt.toMillis()).toISOString()})`;
    }

    // 2. Daily scheduled time matches
    if (!shouldSend && currentHHMM === notifs.time) {
      shouldSend = true;
      reason = `daily trigger at ${currentHHMM}`;
    }

    // 3. Catchup: no snooze pending and haven't notified yet today — fire immediately
    if (!shouldSend && !notifs.nextNotifyAt) {
      const lastDateStr = notifs.lastNotifiedAt ? getIsraelDateStr(notifs.lastNotifiedAt.toDate()) : '';
      if (lastDateStr !== todayStr) {
        shouldSend = true;
        reason = `catchup (last notified: ${lastDateStr || 'never'}, today: ${todayStr})`;
      }
    }

    console.log(`[sendPlantNotifications] time=${currentHHMM} scheduledTime=${notifs.time} nextNotifyAt=${notifs.nextNotifyAt?.toDate().toISOString() ?? 'null'} lastSent=${minsSinceLast}m ago shouldSend=${shouldSend} reason=${reason}`);

    if (!shouldSend) return;

    // Atomic claim: use a transaction so concurrent invocations can't both pass dedup.
    // The winner writes nowMs as a temporary lastNotifiedAt; the loser sees it and exits.
    let claimed = false;
    try {
      claimed = await db.runTransaction(async tx => {
        const fresh = await tx.get(settingsRef);
        const freshLastMs = fresh.data()?.notifications?.lastNotifiedAt?.toMillis() ?? 0;
        if (nowMs - freshLastMs < 10 * 60 * 1000) return false;
        tx.update(settingsRef, {
          'notifications.lastNotifiedAt': admin.firestore.Timestamp.fromMillis(nowMs),
        });
        return true;
      });
    } catch (e) {
      console.error('[sendPlantNotifications] claim transaction error:', e);
      return;
    }

    if (!claimed) {
      console.log('[sendPlantNotifications] dedup: concurrent instance already claimed this send');
      return;
    }

    // Skip if plants were already watered today (Israel time)
    const plantsSnap = await db.doc('appData/plants').get();
    if (plantsSnap.exists) {
      const history = (plantsSnap.data()?.history ?? {}) as Record<string, unknown>;
      let wateredTodayPlant: string | null = null;

      for (const [plantId, records] of Object.entries(history)) {
        if (!Array.isArray(records)) continue;
        const found = (records as Array<{ date?: string }>).some(
          r => typeof r.date === 'string' && getIsraelDateStr(new Date(r.date)) === todayStr
        );
        if (found) { wateredTodayPlant = plantId; break; }
      }

      if (wateredTodayPlant !== null) {
        console.log(`[sendPlantNotifications] watered today (${todayStr}), first match: ${wateredTodayPlant} — skipping notification`);
        return;
      }
    }

    console.log(`[sendPlantNotifications] sending — reason: ${reason}`);

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

      console.log('[sendPlantNotifications] FCM send succeeded');

      let nextNotifyAt: admin.firestore.Timestamp | null = null;
      const snooze = notifs.snoozeInterval;
      if (snooze && snooze !== 'ללא') {
        let offsetMs = 0;
        if (snooze === 'שעה') offsetMs = 60 * 60 * 1000;
        else if (snooze === 'שלוש שעות') offsetMs = 3 * 60 * 60 * 1000;
        else if (snooze === 'יום למחרת') offsetMs = 24 * 60 * 60 * 1000;
        if (offsetMs > 0) nextNotifyAt = admin.firestore.Timestamp.fromMillis(nowMs + offsetMs);
      }

      // Overwrite the temporary claim timestamp with the real server timestamp
      await settingsRef.update({
        'notifications.lastNotifiedAt': admin.firestore.FieldValue.serverTimestamp(),
        'notifications.nextNotifyAt': nextNotifyAt,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const isStaleToken =
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token';
      if (isStaleToken) {
        console.log(`[sendPlantNotifications] stale token (${code}) — clearing fcmToken`);
        await settingsRef.update({ 'notifications.fcmToken': null });
      } else {
        console.error('[sendPlantNotifications] FCM send error:', e);
      }
    }
  }
);
