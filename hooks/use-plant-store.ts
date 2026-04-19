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

export function usePlantStore() {
  const [overrides, setOverrides] = useState<Record<string, PlantParam[]>>({})
  const [history, setHistory] = useState<Record<string, WateringRecord[]>>({})
  const [users, setUsers] = useState<AppUser[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Listen to Users
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists() && snap.data().users) {
        setUsers(snap.data().users)
      } else {
        setUsers([])
      }
    }, (error) => {
      console.warn("Firestore settings read error:", error)
    })
    return () => unsub()
  }, [])

  // Listen to Plant Data
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'appData', 'plants'), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setOverrides(data.overrides || {})
        setHistory(data.history || {})
      }
      setHydrated(true)
    }, (error) => {
      console.warn("Firestore appData read error:", error)
      setHydrated(true) // Still hydrate to show base plants
    })
    return () => unsub()
  }, [])

  const plants = basePlants.map((p) => mergePlantParams(p, overrides, history))

  // Update Firestore helper
  const updateFirebaseDoc = async (newOverrides: any, newHistory: any) => {
    try {
      await setDoc(doc(db, 'appData', 'plants'), {
        overrides: newOverrides,
        history: newHistory
      }, { merge: true })
    } catch (e) {
       console.error("Error updating firebase", e)
    }
  }

  // Set all params for a plant
  const setPlantParams = useCallback((plantId: string, params: PlantParam[]) => {
    setOverrides((prev) => {
      const next = { ...prev, [plantId]: params }
      updateFirebaseDoc(next, history)
      return next
    })
  }, [history])

  // Update single param
  const updateParam = useCallback((plantId: string, key: string, value: string) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = current.map((p) => (p.key === key ? { ...p, value } : p))
      const nextOverrides = { ...prev, [plantId]: next }
      updateFirebaseDoc(nextOverrides, history)
      return nextOverrides
    })
  }, [history])

  const updateParamLabel = useCallback((plantId: string, key: string, label: string) => {
     setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = current.map((p) => (p.key === key ? { ...p, label } : p))
      const nextOverrides = { ...prev, [plantId]: next }
      updateFirebaseDoc(nextOverrides, history)
      return nextOverrides
    })
  }, [history])

  const updateParamIcon = useCallback((plantId: string, key: string, icon: string) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = current.map((p) => (p.key === key ? { ...p, icon } : p))
      const nextOverrides = { ...prev, [plantId]: next }
      updateFirebaseDoc(nextOverrides, history)
      return nextOverrides
    })
  }, [history])

  const addParam = useCallback((plantId: string, param: PlantParam) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = [...current, param]
      const nextOverrides = { ...prev, [plantId]: next }
      updateFirebaseDoc(nextOverrides, history)
      return nextOverrides
    })
  }, [history])

  const removeParam = useCallback((plantId: string, key: string) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = current.filter((p) => p.key !== key)
      const nextOverrides = { ...prev, [plantId]: next }
      updateFirebaseDoc(nextOverrides, history)
      return nextOverrides
    })
  }, [history])

  const addWateringRecord = useCallback((plantId: string, record: WateringRecord) => {
    setHistory((prev) => {
      const current = prev[plantId] || []
      const next = [record, ...current]
      const nextObj = { ...prev, [plantId]: next }
      updateFirebaseDoc(overrides, nextObj)
      return nextObj
    })
  }, [overrides])

  // User management
  const addUser = async (name: string) => {
    const newUser = { id: crypto.randomUUID(), name }
    const nextUsers = [...users, newUser]
    setUsers(nextUsers)
    await setDoc(doc(db, 'settings', 'general'), { users: nextUsers }, { merge: true })
  }

  const removeUser = async (id: string) => {
    const nextUsers = users.filter(u => u.id !== id)
    setUsers(nextUsers)
    await setDoc(doc(db, 'settings', 'general'), { users: nextUsers }, { merge: true })
  }

  return {
    plants,
    hydrated,
    users,
    addUser,
    removeUser,
    setPlantParams,
    updateParam,
    updateParamLabel,
    updateParamIcon,
    addParam,
    removeParam,
    addWateringRecord,
  }
}
