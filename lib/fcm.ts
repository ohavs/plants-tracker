import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from './firebase';

export async function registerFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) return null;
  } catch {
    return null;
  }

  if (!('Notification' in window)) return null;

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

  if (permission !== 'granted') return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[fcm] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set');
    return null;
  }

  try {
    // Register the dedicated FCM service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (e) {
    console.error('[fcm] getToken error:', e);
    return null;
  }
}
