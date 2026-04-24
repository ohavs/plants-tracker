'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Settings, Droplets, X } from 'lucide-react'
import { useImagePreloader } from '@/hooks/use-image-preloader'
import { usePlantStore } from '@/hooks/use-plant-store'
import PlantDetails from './plant-details'
import PlantSettings from './plant-settings'
import type { Plant } from '@/lib/plants-data'

export default function PlantCarousel() {
  const { plants, users, addWateringRecordAll } = usePlantStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [direction, setDirection] = useState(0)
  const [showUniversalUserSelect, setShowUniversalUserSelect] = useState(false)
  const [universalWateredSuccess, setUniversalWateredSuccess] = useState(false)
  
  useImagePreloader()

  const currentPlant = plants[currentIndex]
  const prevPlant = plants[(currentIndex - 1 + plants.length) % plants.length]
  const nextPlant = plants[(currentIndex + 1) % plants.length]

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 30
    if (info.offset.x > threshold && info.velocity.x > -50) {
      setDirection(-1)
      setCurrentIndex((prev) => (prev - 1 + plants.length) % plants.length)
    } else if (info.offset.x < -threshold && info.velocity.x < 50) {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % plants.length)
    }
  }, [plants.length])

  const handlePlantTap = useCallback(() => {
    setSelectedPlant(currentPlant)
  }, [currentPlant])

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }, [currentIndex])

  const confirmUniversalWatering = useCallback((userName: string, userId: string) => {
    setShowUniversalUserSelect(false)
    addWateringRecordAll({ date: new Date().toISOString(), userId, userName })
    setUniversalWateredSuccess(true)
    setTimeout(() => setUniversalWateredSuccess(false), 2500)
  }, [addWateringRecordAll])

  const handleUniversalWaterClick = useCallback(() => {
    if (users.length === 0) {
      confirmUniversalWatering('אנונימי', 'guest')
    } else {
      setShowUniversalUserSelect(true)
    }
  }, [users, confirmUniversalWatering])

  const bgVariants = {
    enter: { opacity: 0, scale: 1.05 },
    center: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  }

  const plantSlideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 250 : -250,
      opacity: 0,
      scale: 0.85,
    }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (direction: number) => ({
      x: direction > 0 ? -250 : 250,
      opacity: 0,
      scale: 0.85,
    }),
  }

  const textVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <>
      {/* ═══ Background Layer ═══ */}
      <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={`bg-${currentPlant.id}`}
            variants={bgVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 will-change-transform"
          >
            <img
              src={currentPlant.backgroundImage}
              alt=""
              className="object-cover w-full h-full"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
          </motion.div>
        </AnimatePresence>

        {/* Preload adjacent backgrounds silently */}
        <div className="hidden">
          <img src={prevPlant.backgroundImage} alt="" />
          <img src={nextPlant.backgroundImage} alt="" />
        </div>

        {/* ═══ UI Overlay ═══ */}
        <div className="relative flex h-full flex-col items-center justify-between px-6 py-6">
          
          {/* Top bar */}
          <div className="flex w-full items-center justify-between safe-area-top pt-6">
            <motion.button
              onClick={() => setShowSettings(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="הגדרות"
            >
              <Settings className="h-5 w-5 text-white/80" />
            </motion.button>

            <div className="flex gap-2">
              {[...plants].reverse().map((_, revIndex) => {
                const actualIndex = plants.length - 1 - revIndex;
                return (
                  <motion.button
                    key={actualIndex}
                    className="h-2 rounded-full cursor-pointer touch-manipulation"
                    animate={{
                      backgroundColor: actualIndex === currentIndex 
                        ? 'rgba(255, 255, 255, 0.9)' 
                        : 'rgba(255, 255, 255, 0.3)',
                      width: actualIndex === currentIndex ? 22 : 8,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={() => goToSlide(actualIndex)}
                    aria-label={`צמח ${actualIndex + 1}`}
                  />
                )
              })}
            </div>

            <div className="w-10" />
          </div>

          {/* ═══ Plant Hero Area ═══ */}
          <div className="flex-1 flex flex-col items-center justify-center w-full mt-2">
            <motion.div
              className="relative w-full cursor-grab active:cursor-grabbing flex items-center justify-center"
              style={{ height: '62vh' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
            >
              <AnimatePresence custom={direction}>
                <motion.div
                  key={currentPlant.id}
                  custom={direction}
                  variants={plantSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute carousel-plant-container"
                  style={{ cursor: 'pointer', transform: 'translateZ(0)', willChange: 'transform' }}
                  onTap={handlePlantTap}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={currentPlant.image}
                    alt={currentPlant.name}
                    className="carousel-plant-image select-none pointer-events-none"
                    draggable={false}
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Text */}
            <div className="relative w-full flex flex-col items-center min-h-[100px] mt-2">
              <AnimatePresence custom={direction}>
                <motion.div
                  key={`text-${currentPlant.id}`}
                  custom={direction}
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute flex flex-col items-center"
                >
                  <h1 className="text-center text-4xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                    {currentPlant.nickname || currentPlant.name}
                  </h1>
                  {currentPlant.nickname && (
                    <p className="mt-1 text-center text-sm text-white/50 font-medium tracking-wide">
                      {currentPlant.name}
                    </p>
                  )}
                  <p className="mt-2 text-center text-sm text-white/60 max-w-[280px] font-light leading-relaxed">
                    {currentPlant.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom hints */}
          <div className="flex flex-col items-center gap-3 pb-2 safe-area-bottom">
            {/* Universal watering button */}
            <motion.button
              onClick={handleUniversalWaterClick}
              className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold backdrop-blur-md border transition-colors"
              style={{
                backgroundColor: universalWateredSuccess ? 'oklch(0.45 0.12 200 / 0.55)' : 'oklch(0.3 0.08 150 / 0.45)',
                borderColor: universalWateredSuccess ? 'oklch(0.6 0.14 200 / 0.4)' : 'oklch(0.6 0.1 150 / 0.25)',
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Droplets className="h-4 w-4 text-white/80" />
              <span className="text-white/90">
                {universalWateredSuccess ? 'כל הצמחים הושקו! 💧' : 'השקיתי את כולם'}
              </span>
            </motion.button>

            <motion.div
              className="flex items-center gap-3 text-white/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ChevronRight className="h-4 w-4 animate-pulse" />
              <span className="text-xs font-light tracking-wide">החליקו לצמח הבא</span>
              <ChevronLeft className="h-4 w-4 animate-pulse" />
            </motion.div>
            <motion.p
              className="text-[10px] text-white/25 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              לחצו על הצמח לפרטים נוספים
            </motion.p>
          </div>
        </div>
      </div>

      {/* Plant Details */}
      <AnimatePresence>
        {selectedPlant && (
          <PlantDetails
            plant={selectedPlant}
            onClose={() => setSelectedPlant(null)}
            onChangeIndex={(idx) => setCurrentIndex(idx)}
          />
        )}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <PlantSettings onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Universal watering user select */}
      <AnimatePresence>
        {showUniversalUserSelect && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUniversalUserSelect(false)}
          >
            <motion.div
              className="w-full max-w-[320px] bg-[#1c1c1e] rounded-3xl p-5 border border-white/10 shadow-2xl relative flex flex-col items-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowUniversalUserSelect(false)}
                className="absolute top-4 right-4 text-white/50 bg-white/10 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="mt-3 mb-2 flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-1">
                  <Droplets className="h-6 w-6 text-white/70" />
                </div>
                <h3 className="text-xl font-bold text-white">מי משקה עכשיו? 💧</h3>
                <p className="text-xs text-white/40 text-center">ההשקיה תתווסף לכל הצמחים</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-h-[50vh] overflow-y-auto no-scrollbar pt-4 pb-2 px-1" dir="rtl">
                {users.map((u) => (
                  <motion.button
                    key={u.id}
                    onClick={() => confirmUniversalWatering(u.name, u.id)}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-2xl border border-white/10 bg-white/10 p-4 flex flex-col items-center justify-center gap-2"
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
    </>
  )
}
