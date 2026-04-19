'use client'

import { useState, useEffect, useCallback } from 'react'
import { plants as basePlants, type Plant, type PlantParam, type WateringRecord } from '@/lib/plants-data'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

export type AppUser = {
  id: string
  name: string
}

function mergePlantParams(
  plant: Plant,
  overrides: Record<string, PlantParam[]>,
  history: Record<string, WateringRecord[]>
) {
  const storedParams = overrides[plant.id]
  const storedHistory = history[plant.id] || []
  return {
    ...plant,
    params: storedParams || plant.params,
    wateringHistory: storedHistory,
  }
}

let globalOverrides: Record<string, PlantParam[]> = {}
let globalHistory: Record<string, WateringRecord[]> = {}
let globalUsers: AppUser[] = []
let globalHydrated = false
let globalNotifications = {
  enabled: false,
  time: '09:00',
  snoozeInterval: 'שעה',
}

const listeners = new Set<() => void>()
let isInitialized = false

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
          if (data.notifications) globalNotifications = { ...globalNotifications, ...data.notifications }
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

  const plants = basePlants.map((p) => mergePlantParams(p, globalOverrides, globalHistory))

  const updateFirebaseDoc = async (newOverrides: any, newHistory: any) => {
    try {
      globalOverrides = newOverrides
      globalHistory = newHistory
      notifyAll()
      await setDoc(doc(db, 'appData', 'plants'), {
        overrides: newOverrides,
        history: newHistory
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
    await setDoc(doc(db, 'settings', 'general'), { notifications: globalNotifications }, { merge: true })
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
  }
}
