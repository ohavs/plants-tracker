'use client'

/**
 * usePlantStore — simple localStorage-backed store for per-plant param overrides.
 *
 * Strategy:
 * - Base data lives in plants-data.ts (source of truth for structure)
 * - User edits are stored in localStorage as a map: { [plantId]: PlantParam[] }
 * - On read, we merge: stored params override defaults, new custom params are appended
 * - This means base data can still be updated in code without losing user edits
 */

import { useState, useEffect, useCallback } from 'react'
import { plants as basePlants, type Plant, type PlantParam } from '@/lib/plants-data'

const STORAGE_KEY = 'plant-params-v1'
const HISTORY_KEY = 'plant-history-v1'

type ParamOverrides = Record<string, PlantParam[]>
type HistoryOverrides = Record<string, string[]>

function loadOverrides(): ParamOverrides {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function loadHistory(): HistoryOverrides {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveOverrides(overrides: ParamOverrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

function saveHistory(history: HistoryOverrides) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

/** Merge base params with stored overrides for a single plant */
function mergePlantParams(plant: Plant, overrides: ParamOverrides, history: HistoryOverrides): Plant {
  const storedParams = overrides[plant.id]
  const storedHistory = history[plant.id] || []
  return { 
    ...plant, 
    params: storedParams || plant.params,
    wateringHistory: storedHistory
  }
}

export function usePlantStore() {
  const [overrides, setOverrides] = useState<ParamOverrides>({})
  const [history, setHistory] = useState<HistoryOverrides>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setOverrides(loadOverrides())
    setHistory(loadHistory())
    setHydrated(true)
  }, [])

  /** Get all plants with overrides applied */
  const plants = basePlants.map((p) => mergePlantParams(p, overrides, history))

  /** Update all params for a plant (replace entire list) */
  const setPlantParams = useCallback((plantId: string, params: PlantParam[]) => {
    setOverrides((prev) => {
      const next = { ...prev, [plantId]: params }
      saveOverrides(next)
      return next
    })
  }, [])

  /** Update a single param value for a plant */
  const updateParam = useCallback((plantId: string, key: string, value: string) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = current.map((p) => (p.key === key ? { ...p, value } : p))
      const nextOverrides = { ...prev, [plantId]: next }
      saveOverrides(nextOverrides)
      return nextOverrides
    })
  }, [])

  /** Update param label for a plant */
  const updateParamLabel = useCallback((plantId: string, key: string, label: string) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = current.map((p) => (p.key === key ? { ...p, label } : p))
      const nextOverrides = { ...prev, [plantId]: next }
      saveOverrides(nextOverrides)
      return nextOverrides
    })
  }, [])

  /** Update param icon for a plant */
  const updateParamIcon = useCallback((plantId: string, key: string, icon: string) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = current.map((p) => (p.key === key ? { ...p, icon } : p))
      const nextOverrides = { ...prev, [plantId]: next }
      saveOverrides(nextOverrides)
      return nextOverrides
    })
  }, [])

  /** Add a new custom param to a plant */
  const addParam = useCallback((plantId: string, param: PlantParam) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = [...current, param]
      const nextOverrides = { ...prev, [plantId]: next }
      saveOverrides(nextOverrides)
      return nextOverrides
    })
  }, [])

  /** Remove a param from a plant */
  const removeParam = useCallback((plantId: string, key: string) => {
    setOverrides((prev) => {
      const plant = basePlants.find((p) => p.id === plantId)
      if (!plant) return prev
      const current = prev[plantId] ?? plant.params
      const next = current.filter((p) => p.key !== key)
      const nextOverrides = { ...prev, [plantId]: next }
      saveOverrides(nextOverrides)
      return nextOverrides
    })
  }, [])

  /** Record a watering event */
  const addWateringRecord = useCallback((plantId: string, isoDateString: string) => {
    setHistory((prev) => {
      const current = prev[plantId] || []
      const next = [isoDateString, ...current]
      const nextObj = { ...prev, [plantId]: next }
      saveHistory(nextObj)
      return nextObj
    })
  }, [])

  return {
    plants,
    hydrated,
    setPlantParams,
    updateParam,
    updateParamLabel,
    updateParamIcon,
    addParam,
    removeParam,
    addWateringRecord,
  }
}
