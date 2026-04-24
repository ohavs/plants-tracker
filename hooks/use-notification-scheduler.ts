'use client'

import { useEffect, useRef } from 'react'
import { usePlantStore } from './use-plant-store'

const STORAGE_LAST_MAIN = 'notif_last_main_date'
const STORAGE_LAST_NOTIF_TS = 'notif_last_ts'
const STORAGE_SNOOZE_COUNT = 'notif_snooze_count_date' // "YYYY-MM-DD:count"
const MAX_SNOOZE_PER_DAY = 5

function snoozeMs(interval: string): number | null {
  if (interval === 'שעה') return 60 * 60 * 1000
  if (interval === 'שלוש שעות') return 3 * 60 * 60 * 1000
  return null // 'יום למחרת' and 'ללא' handled separately
}

async function showSWNotification(title: string, body: string, tag: string) {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag,
      renotify: true,
    } as NotificationOptions)
  } catch (e) {
    console.warn('[Notifications] SW showNotification failed:', e)
  }
}

export async function syncConfigToSW(config: { enabled: boolean; time: string; snoozeInterval: string }) {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'STORE_NOTIF_CONFIG', config })
  } catch (_) {}
}

export async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    if ('periodicSync' in reg) {
      const perm = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName })
      if (perm.state === 'granted') {
        await (reg as any).periodicSync.register('check-watering-notifications', {
          minInterval: 60 * 60 * 1000,
        })
      }
    }
  } catch (_) {}
}

export function useNotificationScheduler() {
  const { notifications, plants } = usePlantStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!notifications.enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    syncConfigToSW(notifications)
    registerPeriodicSync()

    const check = async () => {
      if (Notification.permission !== 'granted') return

      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      const [cfgHr, cfgMin] = notifications.time.split(':').map(Number)
      const totalNow = now.getHours() * 60 + now.getMinutes()
      const totalCfg = cfgHr * 60 + cfgMin
      const inMainWindow = Math.abs(totalNow - totalCfg) <= 1

      const lastMainDate = localStorage.getItem(STORAGE_LAST_MAIN)

      // ── Main daily notification ──
      if (inMainWindow && lastMainDate !== today) {
        localStorage.setItem(STORAGE_LAST_MAIN, today)
        localStorage.setItem(STORAGE_LAST_NOTIF_TS, String(now.getTime()))
        localStorage.setItem(STORAGE_SNOOZE_COUNT, `${today}:0`)
        await showSWNotification(
          'הגיע הזמן להשקות! 💧',
          'הצמחים שלך מחכים לגשם קטן...',
          'daily-watering'
        )
        return
      }

      // ── Snooze / nagger ──
      const ms = snoozeMs(notifications.snoozeInterval)
      if (!ms) return
      if (lastMainDate !== today) return // Main notification hasn't fired today yet

      const lastNotifTs = Number(localStorage.getItem(STORAGE_LAST_NOTIF_TS) || '0')
      if (!lastNotifTs) return
      if (now.getTime() - lastNotifTs < ms - 30_000) return // Not time yet (30s tolerance)

      // Check snooze count cap
      const snoozeEntry = localStorage.getItem(STORAGE_SNOOZE_COUNT) || ''
      const [snoozeDate, snoozeCountStr] = snoozeEntry.split(':')
      const snoozeCount = snoozeDate === today ? Number(snoozeCountStr) : 0
      if (snoozeCount >= MAX_SNOOZE_PER_DAY) return

      // Check if any plant was watered since the last notification
      const anyWateredSince = plants.some((plant) => {
        const latest = plant.wateringHistory?.[0]
        return latest && new Date(latest.date).getTime() > lastNotifTs
      })
      if (anyWateredSince) return

      localStorage.setItem(STORAGE_LAST_NOTIF_TS, String(now.getTime()))
      localStorage.setItem(STORAGE_SNOOZE_COUNT, `${today}:${snoozeCount + 1}`)
      await showSWNotification(
        'עדיין לא השקית! 🌿',
        'הצמחים שלך עדיין צמאים — קח דקה להשקות',
        'watering-reminder'
      )
    }

    check()
    intervalRef.current = setInterval(check, 30_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [notifications.enabled, notifications.time, notifications.snoozeInterval, plants])
}
