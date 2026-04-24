'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, Plus, Leaf, Trash2, Check, Pencil, Bell, Send, Calendar, AlertTriangle } from 'lucide-react'
import { PARAM_ICONS, DEFAULT_PARAM_ICON, type Plant, type PlantParam } from '@/lib/plants-data'
import { usePlantStore, type AppUser } from '@/hooks/use-plant-store'

interface PlantSettingsProps {
  onClose: () => void
}

export default function PlantSettings({ onClose }: PlantSettingsProps) {
  const { plants } = usePlantStore()
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)

  // Keep selectedPlant in sync with live store data
  const livePlant = selectedPlant
    ? plants.find((p) => p.id === selectedPlant.id) ?? selectedPlant
    : null

  return (
    <motion.div
      className="fixed inset-0 z-50 h-[100dvh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={livePlant ? () => setSelectedPlant(null) : onClose}
      />

      {/* Sheet */}
      <motion.div
        className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col mx-auto max-w-[480px]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        <div className="glass-details rounded-t-[28px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-3">
            <motion.button
              onClick={livePlant ? () => setSelectedPlant(null) : onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
              whileTap={{ scale: 0.9 }}
              aria-label="חזרה"
            >
              {livePlant ? (
                <ChevronLeft className="h-5 w-5 text-white" />
              ) : (
                <X className="h-5 w-5 text-white" />
              )}
            </motion.button>
            <h2 className="text-xl font-bold text-white">
              {livePlant ? (livePlant.nickname || livePlant.name) : 'הגדרות'}
            </h2>
          </div>

          {/* Drag handle */}
          <div className="flex justify-center mb-1">
            <div className="w-10 h-1 rounded-full bg-white/10" />
          </div>

          {/* Content */}
          <div className="overflow-y-auto no-scrollbar">
            <AnimatePresence mode="popLayout" initial={false}>
              {livePlant ? (
                <motion.div
                  key="plant-detail"
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -60, opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                >
                  <PlantParamEditor plant={livePlant} />
                </motion.div>
              ) : (
                <motion.div
                  key="plant-list"
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 60, opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                >
                  <PlantList plants={plants} onSelect={setSelectedPlant} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Plant list
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function PlantList({ plants, onSelect }: { plants: Plant[]; onSelect: (p: Plant) => void }) {
  return (
    <div className="px-5 pb-10 safe-area-bottom flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Leaf className="h-4 w-4 text-white/35" />
        <span className="text-xs text-white/35 font-medium tracking-wide">הצמחים שלי</span>
      </div>

      {plants.map((plant, index) => (
        <motion.button
          key={plant.id}
          className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/5 p-3 text-right w-full"
          onClick={() => onSelect(plant)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
            <Image src={plant.image} alt={plant.name} width={56} height={56} className="object-contain p-1 w-full h-full" />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <h3 className="text-base font-semibold text-white/90 truncate">{plant.nickname || plant.name}</h3>
            {plant.nickname && (
              <p className="text-[11px] text-white/35 font-medium truncate">{plant.name}</p>
            )}
            {plant.purchaseDate ? (
              <p className="text-xs text-white/35 font-light mt-0.5 flex items-center justify-end gap-1">
                <Calendar className="h-2.5 w-2.5" />
                נרכש {new Date(plant.purchaseDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-xs text-white/20 font-light truncate mt-0.5">{plant.description}</p>
            )}
          </div>
          <ChevronLeft className="h-4 w-4 text-white/25 shrink-0" />
        </motion.button>
      ))}

      <motion.button
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 p-4 mt-1 text-white/30 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="h-5 w-5" />
        <span className="text-sm font-medium">הוסף צמח חדש</span>
      </motion.button>

      <div className="flex justify-center mt-5 mb-1">
        <span className="text-[10px] text-white/12">Plant Care Tracker v0.1.0</span>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
         <UsersManager />
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
         <NotificationSettings />
      </div>
    </div>
  )
}

function NotificationSettings() {
  const { notifications, updateNotifications } = usePlantStore()
  const timeStr = notifications.time || '09:00'
  const [hr, min] = timeStr.split(':')

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
        return alert('המכשיר או הדפדפן להפעיל התראות. נסה דרך האפליקציה המותקנת (PWA).')
    }
    
    let permission = Notification.permission;
    if (permission !== 'granted') {
       permission = await Notification.requestPermission();
    }
    
    if (permission === 'granted') {
       try {
           const reg = await navigator.serviceWorker.ready;
           if (reg) {
               await reg.showNotification('הגיע הזמן להשקות! 💧', {
                  body: 'בדיקת התראה מוצלחת. מחכים לך באפליקציה!',
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-72x72.png',
                  vibrate: [200, 100, 200]
               } as any);
           } else {
               alert("לא נמצא שירות רקע פעיל להתראות (נסה לרענן את האפליקציה).");
           }
       } catch (e) {
           console.error("SW Notification failed", e);
           alert("שגיאה בהקפצת ההתראה אל מחוץ לאפליקציה: " + String(e));
       }
    } else {
       alert('אנא אשר התראות בהגדרות הטלפון/דפדפן תחילה.');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
            <Bell className="h-[9px] w-[9px] text-white/60" />
        </div>
        <span className="text-xs font-medium tracking-wide text-white/35">התראות מבוססות זמן</span>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
         {/* Toggle */}
         <div className="flex items-center justify-between">
           <span className="text-sm font-semibold text-white/90">הפעל התראות השקיה</span>
           <button 
             onClick={() => updateNotifications({ enabled: !notifications.enabled })}
             className={`relative h-6 w-11 rounded-full transition-colors ${notifications.enabled ? 'bg-emerald-500' : 'bg-white/20'}`}
           >
             <motion.div 
               className="absolute top-1 h-4 w-4 rounded-full bg-white"
               animate={{ right: notifications.enabled ? '4px' : '24px' }}
               transition={{ type: 'spring', damping: 20, stiffness: 300 }}
             />
           </button>
         </div>

         <AnimatePresence>
            {notifications.enabled && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="mt-1 flex flex-col gap-5 overflow-hidden border-t border-white/10 pt-4"
               >
                 {/* Custom Time Selection UI */}
                 <div className="flex flex-col gap-2">
                   <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60 font-semibold">שעת התראה ביום</span>
                      <span className="text-xl font-bold tracking-widest text-emerald-400">{hr}:{min}</span>
                   </div>
                   
                   <div className="flex flex-col gap-1.5" dir="ltr">
                      {/* Hours row */}
                      <div className="flex items-center gap-2 px-1 pb-2 -mx-1 overflow-x-auto snap-x no-scrollbar">
                        <span className="pr-1 text-[10px] font-bold uppercase tracking-wider text-white/20">HR</span>
                        {Array.from({length: 24}).map((_, i) => {
                          const h = i.toString().padStart(2, '0');
                          const isSelected = h === hr;
                          return (
                             <button 
                               key={`hr-${h}`}
                               onClick={() => updateNotifications({ time: `${h}:${min}` })}
                               className={`snap-center flex-shrink-0 cursor-pointer rounded-2xl px-4 py-2 text-[15px] font-bold transition-all ${isSelected ? 'scale-105 bg-emerald-500 text-white shadow-lg' : 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10'}`}
                             >{h}</button>
                          )
                        })}
                      </div>
                      
                      {/* Minutes row */}
                      <div className="flex items-center gap-2 px-1 pb-1 -mx-1 overflow-x-auto snap-x no-scrollbar">
                        <span className="pr-1 text-[10px] font-bold uppercase tracking-wider text-white/20">MIN</span>
                        {Array.from({length: 12}).map((_, i) => {
                          const m = (i * 5).toString().padStart(2, '0');
                          const isSelected = m === min;
                          return (
                             <button 
                               key={`min-${m}`}
                               onClick={() => updateNotifications({ time: `${hr}:${m}` })}
                               className={`snap-center flex-shrink-0 cursor-pointer rounded-2xl px-4 py-2 text-[15px] font-bold transition-all ${isSelected ? 'scale-105 bg-emerald-500 text-white shadow-lg' : 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10'}`}
                             >{m}</button>
                          )
                        })}
                      </div>
                   </div>
                 </div>
                 
                 {/* Snooze Options */}
                 <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white/60">מצב "נודניק"</span>
                      <span className="text-[10px] font-light text-white/30">במידה ולא סומן כהושקה:</span>
                   </div>
                   
                   <div className="flex gap-2 pb-1 -mx-2 px-2 overflow-x-auto snap-x no-scrollbar" dir="rtl">
                      {[
                        { value: 'שעה', label: 'כל שעה' },
                        { value: 'שלוש שעות', label: 'כל 3 שעות' },
                        { value: 'יום למחרת', label: 'מחרת באותה שעה' },
                        { value: 'ללא', label: 'כיבוי' }
                      ].map(opt => (
                         <button
                            key={opt.value}
                            onClick={() => updateNotifications({ snoozeInterval: opt.value })}
                            className={`snap-center flex-shrink-0 rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                               notifications.snoozeInterval === opt.value 
                               ? 'scale-105 bg-white text-[#121212] shadow-lg' 
                               : 'bg-white/10 text-white/50 hover:bg-white/15'
                            }`}
                         >
                            {opt.label}
                         </button>
                      ))}
                   </div>
                 </div>

                 {/* Test Notification Button */}
                 <button 
                   onClick={handleTestNotification}
                   className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                 >
                   <Send className="h-4 w-4" />
                   שלח התראת ניסיון לטלפון 
                 </button>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  )
}

function UsersManager() {
  const { users, addUser, removeUser } = usePlantStore()
  const [newUserName, setNewUserName] = useState('')

  const handleAdd = () => {
    if (!newUserName.trim()) return
    addUser(newUserName.trim())
    setNewUserName('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-4 w-4 bg-white/20 rounded-full flex justify-center items-center">
            <span className="text-[9px] text-white/60">👤</span>
        </div>
        <span className="text-xs text-white/35 font-medium tracking-wide">משתמשים</span>
      </div>
      
      {users.map(u => (
        <div key={u.id} className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 p-3">
           <span className="text-sm font-semibold text-white/90">{u.name}</span>
           <button onClick={() => removeUser(u.id)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 transition-colors">
              <Trash2 className="h-3.5 w-3.5 text-white/30" />
           </button>
        </div>
      ))}
      
      <div className="flex gap-2 items-center rounded-2xl bg-white/5 border border-white/10 p-2">
         <input 
            type="text"
            value={newUserName}
            onChange={e => setNewUserName(e.target.value)}
            placeholder="הוסף משתמש חדש..."
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-white placeholder:text-white/25 outline-none text-right"
            dir="rtl"
         />
         <button onClick={handleAdd} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors">
            <Plus className="h-4 w-4 text-white/70" />
         </button>
      </div>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Custom purchase date picker
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function PurchaseDatePicker({ value, onChange, accentColor }: { value: string; onChange: (d: string) => void; accentColor: string }) {
  const [open, setOpen] = useState(false)

  const parsed = value ? new Date(value + 'T12:00:00') : null
  
  const [lYear, setLYear] = useState<number | null>(parsed ? parsed.getFullYear() : null)
  const [lMonth, setLMonth] = useState<number | null>(parsed ? parsed.getMonth() + 1 : null)
  const [lDay, setLDay] = useState<number | null>(parsed ? parsed.getDate() : null)

  const currentYear = new Date().getFullYear()
  const years  = Array.from({ length: 10 }, (_, i) => currentYear - i)
  const months = [
    'ינואר','פברואר','מרץ','אפריל','מאי','יוני',
    'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'
  ]
  const daysInMonth = (m: number, y: number) => new Date(y, m, 0).getDate()
  const days = Array.from({ length: lMonth && lYear ? daysInMonth(lMonth, lYear) : 31 }, (_, i) => i + 1)

  const save = (d: number | null, m: number | null, y: number | null) => {
    const finalD = d ?? lDay
    const finalM = m ?? lMonth
    const finalY = y ?? lYear
    
    if (d !== null) setLDay(d)
    if (m !== null) setLMonth(m)
    if (y !== null) setLYear(y)

    if (finalD && finalM && finalY) {
      onChange(`${finalY}-${String(finalM).padStart(2, '0')}-${String(finalD).padStart(2, '0')}`)
    }
  }

  const displayLabel = parsed
    ? parsed.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'בחר תאריך'

  return (
    <div className="w-full mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/5 px-4 py-2.5 w-full"
      >
        <Calendar className="h-3.5 w-3.5 text-white/30 shrink-0" />
        <span className="text-xs text-white/40 font-medium flex-1 text-right">תאריך רכישה</span>
        <span className={`text-sm font-semibold ${parsed ? 'text-white/80' : 'text-white/25'}`}>{displayLabel}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl bg-white/5 border border-white/5 mt-1 p-3 flex flex-col gap-3"
          >
            {/* Year row */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/25 font-bold uppercase tracking-widest pr-1">שנה</span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x" dir="ltr">
                {years.map(y => (
                  <button key={y}
                    onClick={() => save(null, null, y)}
                    className={`snap-center flex-shrink-0 rounded-2xl px-4 py-2 text-sm font-bold transition-all ${lYear === y ? 'scale-105 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    style={lYear === y ? { backgroundColor: accentColor } : {}}
                  >{y}</button>
                ))}
              </div>
            </div>
            {/* Month row */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/25 font-bold uppercase tracking-widest pr-1">חודש</span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x" dir="rtl">
                {months.map((name, idx) => {
                  const mNum = idx + 1
                  return (
                    <button key={mNum}
                      onClick={() => save(null, mNum, null)}
                      className={`snap-center flex-shrink-0 rounded-2xl px-4 py-2 text-sm font-bold transition-all ${lMonth === mNum ? 'scale-105 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                      style={lMonth === mNum ? { backgroundColor: accentColor } : {}}
                    >{name}</button>
                  )
                })}
              </div>
            </div>
            {/* Day row */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/25 font-bold uppercase tracking-widest pr-1">יום</span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x" dir="ltr">
                {days.map(d => (
                  <button key={d}
                    onClick={() => save(d, null, null)}
                    className={`snap-center flex-shrink-0 rounded-2xl px-3 py-2 text-sm font-bold transition-all ${lDay === d ? 'scale-105 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    style={lDay === d ? { backgroundColor: accentColor } : {}}
                  >{d}</button>
                ))}
              </div>
            </div>
            {(lDay && lMonth && lYear) && (
              <button onClick={() => setOpen(false)} className="flex w-full items-center justify-center rounded-2xl py-2 text-xs font-semibold text-white/50 bg-white/5">
                סגור
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Per-plant param editor
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function PlantParamEditor({ plant }: { plant: Plant }) {
  const { updateParam, updateParamLabel, updateParamIcon, addParam, removeParam, clearWateringHistory, updatePurchaseDate, updateNickname } = usePlantStore()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [nicknameValue, setNicknameValue] = useState(plant.nickname || '')
  useEffect(() => { setNicknameValue(plant.nickname || '') }, [plant.id])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newIcon, setNewIcon] = useState(DEFAULT_PARAM_ICON)
  const [showDeleteHistoryDialog, setShowDeleteHistoryDialog] = useState(false)

  const handleAddParam = () => {
    if (!newLabel.trim() || !newValue.trim()) return
    const key = `custom-${Date.now()}`
    addParam(plant.id, { key, label: newLabel.trim(), value: newValue.trim(), icon: newIcon })
    setNewLabel('')
    setNewValue('')
    setNewIcon(DEFAULT_PARAM_ICON)
    setShowAddForm(false)
  }

  return (
    <div className="px-5 pb-10 safe-area-bottom flex flex-col gap-4">
      {/* Plant thumbnail + purchase date */}
      <div className="flex flex-col items-center py-2 gap-2">
        <div className="h-24 w-24 mb-1 flex items-center justify-center">
          <Image src={plant.image} alt={plant.name} width={96} height={96} className="object-contain w-full h-full" sizes="96px" />
        </div>
        <p className="text-xs text-white/35 font-light text-center max-w-[240px]">{plant.description}</p>

        {/* Nickname field */}
        <div className="w-full mt-1 flex flex-col gap-1">
          <span className="text-[10px] text-white/25 font-bold uppercase tracking-widest pr-1">כינוי</span>
          <div className="flex gap-2 items-center rounded-2xl bg-white/5 border border-white/5 px-4 py-2.5">
            <input
              type="text"
              value={nicknameValue}
              onChange={(e) => setNicknameValue(e.target.value)}
              onBlur={() => updateNickname(plant.id, nicknameValue.trim())}
              placeholder={`כינוי עבור ${plant.name}...`}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none text-right"
              dir="rtl"
            />
            {nicknameValue && (
              <button
                onClick={() => { setNicknameValue(''); updateNickname(plant.id, '') }}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Purchase date - custom styled picker */}
        <PurchaseDatePicker
          value={plant.purchaseDate || ''}
          onChange={(date) => updatePurchaseDate(plant.id, date)}
          accentColor={plant.accentColor}
        />
      </div>

      {/* Params list */}
      <div>
        <span className="text-xs text-white/35 font-medium mb-2 block">פרמטרים</span>
        <div className="flex flex-col gap-2">
          {plant.params.map((param) => (
            <ParamRow
              key={param.key}
              param={param}
              accentColor={plant.accentColor}
              isEditing={editingKey === param.key}
              onStartEdit={() => setEditingKey(param.key)}
              onEndEdit={() => setEditingKey(null)}
              onValueChange={(val) => updateParam(plant.id, param.key, val)}
              onLabelChange={(val) => updateParamLabel(plant.id, param.key, val)}
              onIconChange={(val) => updateParamIcon(plant.id, param.key, val)}
              onRemove={() => removeParam(plant.id, param.key)}
            />
          ))}
        </div>
      </div>

      {/* Add param */}
      <AnimatePresence>
        {showAddForm ? (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 overflow-hidden"
          >
            <span className="text-xs text-white/40 font-medium">פרמטר חדש</span>

            {/* Icon picker */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(PARAM_ICONS).map(([name, Icon]) => (
                <button
                  key={name}
                  onClick={() => setNewIcon(name)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                    newIcon === name
                      ? 'border-white/40 bg-white/15'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 text-white/70" />
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="שם הפרמטר (לדוגמה: דשן)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 text-right"
              dir="rtl"
            />
            <input
              type="text"
              placeholder="ערך (לדוגמה: פעם בחודש)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 text-right"
              dir="rtl"
            />

            <div className="flex gap-2">
              <button
                onClick={handleAddParam}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: plant.accentColor }}
              >
                <Check className="h-4 w-4" />
                הוסף
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-xl bg-white/8 py-2.5 text-sm text-white/60"
              >
                ביטול
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 p-3.5 text-white/35 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">הוסף פרמטר</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Delete watering history */}
      <button
        onClick={() => (plant.wateringHistory?.length ?? 0) > 0 && setShowDeleteHistoryDialog(true)}
        className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-medium transition-colors ${
          (plant.wateringHistory?.length ?? 0) > 0
            ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 cursor-pointer'
            : 'border-white/5 bg-white/3 text-white/20 cursor-not-allowed'
        }`}
      >
        <Trash2 className="h-4 w-4" />
        {(plant.wateringHistory?.length ?? 0) > 0
          ? 'מחק היסטוריית השקיות'
          : 'אין היסטוריית השקיות'}
      </button>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteHistoryDialog && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowDeleteHistoryDialog(false)}
            />
            {/* Dialog card */}
            <motion.div
              className="relative z-10 w-full max-w-[480px] mx-auto mb-6 px-4"
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="rounded-3xl bg-[#1c2a1e] border border-white/10 p-6 flex flex-col items-center gap-4 shadow-2xl">
                {/* Icon */}
                <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-red-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white/90">מחיקת היסטוריה</h3>
                  <p className="text-sm text-white/45 mt-1 leading-relaxed">
                    האם למחוק את כל היסטוריית ההשקיות
                    של <span className="font-semibold text-white/70">{plant.name}</span>?
                    <br />פעולה זו אינה ניתנת לביטול.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      clearWateringHistory(plant.id)
                      setShowDeleteHistoryDialog(false)
                    }}
                    className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white shadow-lg"
                  >
                    כן, מחק הכל
                  </button>
                  <button
                    onClick={() => setShowDeleteHistoryDialog(false)}
                    className="flex-1 rounded-2xl bg-white/10 py-3 text-sm font-semibold text-white/60"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Single editable param row
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface ParamRowProps {
  param: PlantParam
  accentColor: string
  isEditing: boolean
  onStartEdit: () => void
  onEndEdit: () => void
  onValueChange: (v: string) => void
  onLabelChange: (v: string) => void
  onIconChange: (v: string) => void
  onRemove: () => void
}

function ParamRow({
  param, accentColor, isEditing,
  onStartEdit, onEndEdit, onValueChange, onLabelChange, onIconChange, onRemove
}: ParamRowProps) {
  const Icon = PARAM_ICONS[param.icon] ?? PARAM_ICONS[DEFAULT_PARAM_ICON]

  return (
    <motion.div
      layout
      className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden"
    >
      {/* Collapsed view */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: accentColor }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[11px] text-white/40 font-light">{param.label}</p>
            <p className="text-sm font-semibold text-white/90">{param.value}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={isEditing ? onEndEdit : onStartEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 transition-colors"
          >
            {isEditing ? (
              <Check className="h-3.5 w-3.5 text-white/70" />
            ) : (
              <Pencil className="h-3.5 w-3.5 text-white/40" />
            )}
          </button>
          <button
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-white/30" />
          </button>
        </div>
      </div>

      {/* Expanded edit form */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/5 px-4 py-3 flex flex-col gap-3 overflow-hidden"
          >
            {/* Icon picker */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(PARAM_ICONS).map(([name, IcnComp]) => (
                <button
                  key={name}
                  onClick={() => onIconChange(name)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                    param.icon === name
                      ? 'border-white/40 bg-white/15'
                      : 'border-white/8 bg-white/5'
                  }`}
                >
                  <IcnComp className="h-3.5 w-3.5 text-white/70" />
                </button>
              ))}
            </div>

            {/* Label edit */}
            <input
              type="text"
              value={param.label}
              onChange={(e) => onLabelChange(e.target.value)}
              className="w-full rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-xs text-white/70 outline-none focus:border-white/25 text-right"
              dir="rtl"
              placeholder="שם הפרמטר"
            />

            {/* Value edit */}
            {param.label === 'תדירות השקיה' ? (
              <div className="flex flex-col gap-2 w-full pt-1" dir="rtl">
                <span className="text-white/70 text-sm font-semibold pr-2">פעם ב...</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 snap-x">
                  {[
                    { value: 'יום', label: 'יום' },
                    { value: 'יומיים', label: 'יומיים' },
                    { value: '3 ימים', label: '3 ימים' },
                    { value: '4 ימים', label: '4 ימים' },
                    { value: '5 ימים', label: '5 ימים' },
                    { value: '6 ימים', label: '6 ימים' },
                    { value: 'שבוע', label: 'שבוע' }
                  ].map(opt => {
                    const isSelected = 
                       param.value === `פעם ב${opt.value === 'שבוע' ? 'שבוע' : ' ' + opt.value}` ||
                       (param.value === 'פעם בשבוע' && opt.value === 'שבוע') ||
                       (param.value === 'פעם ביום' && opt.value === 'יום') ||
                       (param.value === 'פעם ביומיים' && opt.value === 'יומיים');
                       
                    return (
                      <button
                         key={opt.value}
                         className={`snap-center px-4 py-2 flex-shrink-0 rounded-2xl text-sm font-medium transition-all ${
                           isSelected ? 'bg-white text-[#121212] shadow-lg scale-105' : 'bg-white/10 text-white/50 hover:bg-white/15'
                         }`}
                         onClick={() => {
                            if (opt.value === 'יום') onValueChange('פעם ביום');
                            else if (opt.value === 'יומיים') onValueChange('פעם ביומיים');
                            else if (opt.value === 'שבוע') onValueChange('פעם בשבוע');
                            else onValueChange(`פעם ב ${opt.value}`);
                         }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={param.value}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-sm text-white font-semibold outline-none focus:border-white/25 text-right"
                dir="rtl"
                placeholder="ערך"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
