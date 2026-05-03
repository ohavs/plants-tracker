'use client'

import { useState, useEffect, useCallback } from 'react'
import { plants as basePlants, type Plant, type PlantParam, type WateringRecord } from '@/lib/plants-data'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { registerFCMToken } from '@/lib/fcm'

export type AppUser = {
  id: string
  name: string
}

function mergePlantParams(
  plant: Plant,
  overrides: Record<string, PlantParam[]>,
  history: Record<string, WateringRecord[]>,
  purchaseDates: Record<string, string>
) {
  const storedParams = overrides[plant.id]
  const storedHistory = history[plant.id] || []
  return {
    ...plant,
    params: storedParams || plant.params,
    wateringHistory: storedHistory,
    purchaseDate: purchaseDates[plant.id] || plant.purchaseDate,
  }
}

let globalOverrides: Record<string, PlantParam[]> = {}
let globalHistory: Record<string, WateringRecord[]> = {}
let globalPurchaseDates: Record<string, string> = {}
let globalUsers: AppUser[] = []
let globalHydrated = false
let globalNotifications = {
  enabled: false,
  time: '09:00',
  snoozeInterval: 'שעה',
  fcmToken: null as string | null,
}

const listeners = new Set<() => void>()
let isInitialized = false
let autoRegisterAttempted = false

function notifyAll() {
  listeners.forEach(l => l())
}

export function usePlantStore() {
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const notify = () => forceUpdate({})
    listeners.add(notify)

    if (!isInitialized) {
      isInitialized = true
      
      onSnapshot(doc(db, 'settings', 'general'), (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          if (data.users) globalUsers = data.users
          if (data.notifications) {
            globalNotifications = { ...globalNotifications, ...data.notifications }

            // If notifications are enabled but token was cleared (e.g. stale token), auto re-register
            if (globalNotifications.enabled && !globalNotifications.fcmToken && !autoRegisterAttempted) {
              autoRegisterAttempted = true
              registerFCMToken().then(token => {
                if (token) {
                  globalNotifications = { ...globalNotifications, fcmToken: token }
                  notifyAll()
                  setDoc(doc(db, 'settings', 'general'), { notifications: { fcmToken: token } }, { mergeFields: ['notifications.fcmToken'] })
                    .catch(e => console.error('[store] FCM auto-register error:', e))
                }
              })
            }
          }
        } else {
          globalUsers = []
        }
        notifyAll()
      }, (error) => {
        console.warn("Firestore settings read error:", error)
      })

      onSnapshot(doc(db, 'appData', 'plants'), (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          globalOverrides = data.overrides || {}
          globalHistory = data.history || {}
          globalPurchaseDates = data.purchaseDates || {}
        }
        globalHydrated = true
        notifyAll()
      }, (error) => {
        console.warn("Firestore appData read error:", error)
        globalHydrated = true
        notifyAll()
      })
    }
    
    return () => {
      listeners.delete(notify)
    }
  }, [])

  const plants = basePlants.map((p) => mergePlantParams(p, globalOverrides, globalHistory, globalPurchaseDates))

  const updateFirebaseDoc = async (newOverrides: any, newHistory: any, newPurchaseDates?: any) => {
    try {
      globalOverrides = newOverrides
      globalHistory = newHistory
      if (newPurchaseDates !== undefined) globalPurchaseDates = newPurchaseDates
      notifyAll()
      await setDoc(doc(db, 'appData', 'plants'), {
        overrides: newOverrides,
        history: newHistory,
        purchaseDates: newPurchaseDates ?? globalPurchaseDates
      }, { merge: true })
    } catch (e) {
       console.error("Error updating firebase", e)
    }
  }

  const setPlantParams = useCallback((plantId: string, params: PlantParam[]) => {
    const nextOverrides = { ...globalOverrides, [plantId]: params }
    updateFirebaseDoc(nextOverrides, globalHistory)
  }, [])

  const updateParam = useCallback((plantId: string, key: string, value: string) => {
    const plant = basePlants.find((p) => p.id === plantId)
    if (!plant) return
    const current = globalOverrides[plantId] ?? plant.params
    const next = current.map((p) => (p.key === key ? { ...p, value } : p))
    const nextOverrides = { ...globalOverrides, [plantId]: next }
    updateFirebaseDoc(nextOverrides, globalHistory)
  }, [])

  const updateParamLabel = useCallback((plantId: string, key: string, label: string) => {
    const plant = basePlants.find((p) => p.id === plantId)
    if (!plant) return
    const current = globalOverrides[plantId] ?? plant.params
    const next = current.map((p) => (p.key === key ? { ...p, label } : p))
    const nextOverrides = { ...globalOverrides, [plantId]: next }
    updateFirebaseDoc(nextOverrides, globalHistory)
  }, [])

  const updateParamIcon = useCallback((plantId: string, key: string, icon: string) => {
    const plant = basePlants.find((p) => p.id === plantId)
    if (!plant) return
    const current = globalOverrides[plantId] ?? plant.params
    const next = current.map((p) => (p.key === key ? { ...p, icon } : p))
    const nextOverrides = { ...globalOverrides, [plantId]: next }
    updateFirebaseDoc(nextOverrides, globalHistory)
  }, [])

  const addParam = useCallback((plantId: string, param: PlantParam) => {
    const plant = basePlants.find((p) => p.id === plantId)
    if (!plant) return
    const current = globalOverrides[plantId] ?? plant.params
    const next = [...current, param]
    const nextOverrides = { ...globalOverrides, [plantId]: next }
    updateFirebaseDoc(nextOverrides, globalHistory)
  }, [])

  const removeParam = useCallback((plantId: string, key: string) => {
    const plant = basePlants.find((p) => p.id === plantId)
    if (!plant) return
    const current = globalOverrides[plantId] ?? plant.params
    const next = current.filter((p) => p.key !== key)
    const nextOverrides = { ...globalOverrides, [plantId]: next }
    updateFirebaseDoc(nextOverrides, globalHistory)
  }, [])

  const addWateringRecord = useCallback((plantId: string, record: WateringRecord) => {
    const current = globalHistory[plantId] || []
    const next = [record, ...current]
    const nextHistory = { ...globalHistory, [plantId]: next }
    updateFirebaseDoc(globalOverrides, nextHistory)
  }, [])

  const addWateringRecordAll = useCallback((record: WateringRecord) => {
    const nextHistory = { ...globalHistory }
    for (const plant of basePlants) {
      nextHistory[plant.id] = [record, ...(nextHistory[plant.id] || [])]
    }
    updateFirebaseDoc(globalOverrides, nextHistory)
  }, [])

  const clearWateringHistory = useCallback((plantId: string) => {
    const nextHistory = { ...globalHistory, [plantId]: [] }
    updateFirebaseDoc(globalOverrides, nextHistory)
  }, [])

  const updatePurchaseDate = useCallback((plantId: string, date: string) => {
    const next = { ...globalPurchaseDates, [plantId]: date }
    updateFirebaseDoc(globalOverrides, globalHistory, next)
  }, [])

  const addUser = async (name: string) => {
    const newUser = { id: crypto.randomUUID(), name }
    const nextUsers = [...globalUsers, newUser]
    globalUsers = nextUsers
    notifyAll()
    await setDoc(doc(db, 'settings', 'general'), { users: nextUsers }, { merge: true })
  }

  const removeUser = async (id: string) => {
    const nextUsers = globalUsers.filter(u => u.id !== id)
    globalUsers = nextUsers
    notifyAll()
    await setDoc(doc(db, 'settings', 'general'), { users: nextUsers }, { merge: true })
  }

  const updateNotifications = async (notifs: Partial<typeof globalNotifications>) => {
    globalNotifications = { ...globalNotifications, ...notifs }
    notifyAll()
    // mergeFields with dot-notation ensures server-managed fields (lastNotifiedAt, nextNotifyAt)
    // are never overwritten, and works even if the document doesn't exist yet
    const mergeFields = Object.keys(notifs).map(k => `notifications.${k}`)
    await setDoc(doc(db, 'settings', 'general'), { notifications: notifs }, { mergeFields })
  }

  return {
    plants,
    hydrated: globalHydrated,
    users: globalUsers,
    notifications: globalNotifications,
    addUser,
    removeUser,
    updateNotifications,
    setPlantParams,
    updateParam,
    updateParamLabel,
    updateParamIcon,
    addParam,
    removeParam,
    addWateringRecord,
    addWateringRecordAll,
    clearWateringHistory,
    updatePurchaseDate,
  }
}
