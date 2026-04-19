'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Droplets, History, Trash2, Calendar, AlertTriangle } from 'lucide-react'
import { PARAM_ICONS, DEFAULT_PARAM_ICON, type Plant } from '@/lib/plants-data'
import { usePlantStore, type AppUser } from '@/hooks/use-plant-store'

interface PlantDetailsProps {
  plant: Plant
  onClose: () => void
}

export default function PlantDetails({ plant: initialPlant, onClose }: PlantDetailsProps) {
  const { plants, addWateringRecord, updateParam, users, clearWateringHistory } = usePlantStore()
  // Always use live data from store so settings changes reflect immediately
  const plant = plants.find((p) => p.id === initialPlant.id) ?? initialPlant

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [isWatered, setIsWatered] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showUserSelect, setShowUserSelect] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const buttonRef = useRef<HTMLButtonElement>(null)
  const rippleIdRef = useRef(0)

  const handleWaterClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Just save the ripple and open user select
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const newRipple = {
      id: rippleIdRef.current++,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setRipples((prev) => [...prev, newRipple])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== newRipple.id)), 600)
    
    if (users.length === 0) {
      // Fallback
      confirmWatering("אנונימי", "guest")
    } else {
      setShowUserSelect(true)
    }
  }

  const confirmWatering = (userName: string, userId: string) => {
    setIsWatered(true)
    setShowUserSelect(false)
    setTimeout(() => setIsWatered(false), 2000)

    // Save history
    const now = new Date()
    addWateringRecord(plant.id, {
       date: now.toISOString(),
       userId,
       userName
    })

    // Update label to indicate watered today if param exists
    const lastWaterKey = params.find(p => p.key === 'lastWatered' || p.label.includes('השקיה אחרונה'))?.key
    if (lastWaterKey) {
      updateParam(plant.id, lastWaterKey, 'היום')
    }
  }

  const params = plant.params

  // Split params into pairs for grid, last one goes full-width if odd count
  const gridParams = params.length % 2 === 0 ? params : params.slice(0, -1)
  const lastParam = params.length % 2 !== 0 ? params[params.length - 1] : null

  return (
    <>
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation()
              setShowHistory(false)
            }}
          >
            <motion.div 
              className="w-full max-w-[340px] bg-[#1a2a1e] rounded-3xl p-5 border border-white/10 cursor-default shadow-2xl relative"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowHistory(false)}
                className="absolute top-4 right-4 text-white/50 bg-white/10 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-bold text-white mb-4 text-center mt-2">\u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d9\u05ea \u05d4\u05e9\u05e7\u05d9\u05d5\u05ea</h3>
              {plant.wateringHistory?.length ? (
                <>
                  <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
                    {plant.wateringHistory.map((record, i) => {
                      const d = new Date(record.date)
                      return (
                        <div key={i} className="flex flex-col gap-1 bg-white/5 rounded-xl p-3">
                           <div className="flex justify-between items-center text-sm">
                             <span className="text-white/90">{d.toLocaleDateString('he-IL')}</span>
                             <span className="text-white/40 text-xs">{d.toLocaleTimeString('he-IL', { hour: '2-digit', minute:'2-digit' })}</span>
                           </div>
                           <span className="text-white/60 text-xs text-right mt-1">\u05d4\u05d5\u05e9\u05e7\u05d4 \u05e2&quot;\u05d9: {record.userName}</span>
                        </div>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/8 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    \u05de\u05d7\u05e7 \u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d4
                  </button>
                </>
              ) : (
                <p className="text-center text-white/50 text-sm py-8">\u05dc\u05d0 \u05ea\u05d5\u05e2\u05d3\u05d5 \u05d4\u05e9\u05e7\u05d9\u05d5\u05ea \u05e2\u05d3\u05d9\u05d9\u05df</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
            <motion.div
              className="relative z-10 w-full max-w-[320px] rounded-3xl bg-[#1a2a1e] border border-white/10 p-6 flex flex-col items-center gap-4 shadow-2xl"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white/90">מחיקת היסטוריה</h3>
                <p className="text-sm text-white/45 mt-1 leading-relaxed">
                  האם למחוק את כל היסטוריית ההשקיות
                  של <span className="font-semibold text-white/70">{plant.name}</span>?
                  <br /><span className="text-[11px] text-white/30">פעולה זו אינה ניתנת לביטול</span>
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    clearWateringHistory(plant.id)
                    setShowDeleteConfirm(false)
                    setShowHistory(false)
                  }}
                  className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white"
                >
                  כן, מחק
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-2xl bg-white/10 py-3 text-sm font-semibold text-white/60"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showUserSelect && (
           <motion.div 
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation()
              setShowUserSelect(false)
            }}
          >
            <motion.div 
              className="w-full max-w-[320px] bg-[#1c1c1e] rounded-3xl p-5 border border-white/10 cursor-default shadow-2xl relative flex flex-col items-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowUserSelect(false)}
                className="absolute top-4 right-4 text-white/50 bg-white/10 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-bold text-white mb-6 mt-3">מי משקה עכשיו? 💧</h3>
              
              <div className="grid grid-cols-2 gap-3 w-full max-h-[50vh] overflow-y-auto no-scrollbar pt-2 pb-4 px-1" dir="rtl">
                 {users.map(u => (
                    <motion.button 
                       key={u.id}
                       onClick={() => confirmWatering(u.name, u.id)}
                       whileTap={{ scale: 0.95 }}
                       className="rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center gap-2"
                       style={{ backgroundColor: plant.accentColor }}
                    >
                       <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-lg">👤</span>
                       </div>
                       <span className="text-white font-semibold text-sm">{u.name}</span>
                    </motion.button>
                 ))}
              </div>
            </motion.div>
          </motion.div>
         )}
      </AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 h-[100dvh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
      {/* Background image */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.1, opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Image
          src={plant.backgroundImage}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </motion.div>

      {/* Base interactive backdrop (Intercepts all clicks) */}
      <div className="absolute inset-0 z-0 cursor-pointer" onClick={onClose} />

      {/* Scrollable content layer */}
      <div 
        className="absolute inset-0 overflow-y-auto no-scrollbar flex justify-center z-10 pointer-events-none"
      >
        <div className="flex min-h-full flex-col w-full max-w-[480px] cursor-default">

          {/* ── Close button ── fixed square circle */}
          <motion.button
            onClick={onClose}
            className="fixed z-[60] top-5 left-5 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 backdrop-blur-xl border border-white/10 pointer-events-auto"
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            aria-label="סגור"
          >
            <X className="h-4 w-4 text-white" />
          </motion.button>

          {/* ── Hero: empty space passes clicks through to base backdrop ── */}
          <motion.div
            className="flex items-center justify-center pt-14 pb-2"
            style={{ height: '50vh', minHeight: 300 }}
          >
            <motion.div
              layoutId={`plant-image-${plant.id}`}
              className="details-plant-container"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={plant.image}
                alt={plant.name}
                width={920}
                height={920}
                className="details-plant-image select-none"
                priority
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </motion.div>
          </motion.div>

          {/* ── Bottom sheet ── */}
          <motion.div
            className="flex-1 glass-details rounded-t-[28px] px-5 pt-6 pb-10 safe-area-bottom pointer-events-auto"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, delay: 0.1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Plant name + description */}
            <motion.div
              className="flex flex-col items-center mb-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-white tracking-tight">{plant.name}</h2>
              <p className="mt-1.5 text-sm text-white/50 text-center max-w-[300px] font-light leading-relaxed">
                {plant.description}
              </p>
              {plant.purchaseDate && (
                <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/5 px-3 py-1">
                  <Calendar className="h-3 w-3 text-white/30" />
                  <span className="text-[11px] text-white/35 font-light">
                    נרכש {new Date(plant.purchaseDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Dynamic params grid — always 2 columns, last is full-width if odd */}
            {gridParams.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {gridParams.map((param, index) => {
                  const Icon = PARAM_ICONS[param.icon] ?? PARAM_ICONS[DEFAULT_PARAM_ICON]
                  return (
                    <motion.div
                      key={param.key}
                      className="flex flex-col gap-2 rounded-2xl bg-white/5 border border-white/5 p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.06 }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: plant.accentColor }}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[11px] text-white/45 font-light leading-tight">{param.label}</span>
                      </div>
                      <span className="text-base font-semibold text-white/90 pr-1">{param.value}</span>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Last param full-width (when odd count) */}
            {lastParam && (() => {
              const LastIcon = PARAM_ICONS[lastParam.icon] ?? PARAM_ICONS[DEFAULT_PARAM_ICON]
              return (
                <motion.div
                  className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 p-4 mb-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + gridParams.length * 0.06 }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: plant.accentColor }}
                    >
                      <LastIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[11px] text-white/45 font-light">{lastParam.label}</span>
                  </div>
                  <span className="text-base font-semibold text-white/90">{lastParam.value}</span>
                </motion.div>
              )
            })()}

            {/* Spacer so button isn't flush with last card when even */}
            {!lastParam && <div className="mb-5" />}

            {/* Water button & history */}
            <div className="flex gap-2 w-full">
              <motion.button
                ref={buttonRef}
                onClick={handleWaterClick}
                className="relative w-full overflow-hidden rounded-2xl py-4 text-base font-semibold flex-1"
                style={{
                  backgroundColor: isWatered ? 'oklch(0.5 0.12 200)' : plant.accentColor,
                }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="ripple-effect"
                    style={{ left: ripple.x - 10, top: ripple.y - 10, width: 20, height: 20 }}
                  />
                ))}
                <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                  <Droplets className="h-5 w-5" />
                  {isWatered ? 'הושקה בהצלחה! 💧' : 'השקתי'}
                </span>
              </motion.button>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowHistory(true)
                }}
                className="flex items-center justify-center rounded-2xl bg-white/10 border border-white/5 w-[60px] flex-shrink-0"
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <History className="h-5 w-5 text-white/80" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
    </>
  )
}
