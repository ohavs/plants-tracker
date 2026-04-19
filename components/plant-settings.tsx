'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, Plus, Leaf, Trash2, Check, Pencil } from 'lucide-react'
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
              {livePlant ? livePlant.name : 'הגדרות'}
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
            <h3 className="text-base font-semibold text-white/90 truncate">{plant.name}</h3>
            <p className="text-xs text-white/35 font-light truncate mt-0.5">{plant.description}</p>
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

      <div className="mt-6">
         <UsersManager />
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
   Per-plant param editor
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function PlantParamEditor({ plant }: { plant: Plant }) {
  const { updateParam, updateParamLabel, updateParamIcon, addParam, removeParam } = usePlantStore()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newIcon, setNewIcon] = useState(DEFAULT_PARAM_ICON)

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
      {/* Plant thumbnail */}
      <div className="flex flex-col items-center py-2">
        <div className="h-24 w-24 mb-1 flex items-center justify-center">
          <Image src={plant.image} alt={plant.name} width={96} height={96} className="object-contain w-full h-full" sizes="96px" />
        </div>
        <p className="text-xs text-white/35 font-light text-center max-w-[240px]">{plant.description}</p>
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
              <div className="flex items-center gap-2 w-full rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-sm text-white font-semibold outline-none focus-within:border-white/25" dir="rtl">
                <span className="text-white/70 whitespace-nowrap">פעם ב...</span>
                <select 
                  className="flex-1 bg-transparent outline-none appearance-none cursor-pointer text-right text-white"
                  value={(() => {
                    const v = param.value;
                    if (v === 'פעם ביום') return 'יום';
                    if (v === 'פעם ביומיים') return 'יומיים';
                    if (v === 'פעם בשבוע') return 'שבוע';
                    if (v.startsWith('פעם ב ')) return v.replace('פעם ב ', '');
                    return 'שבוע';
                  })()} 
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'יום') onValueChange('פעם ביום');
                    else if (v === 'יומיים') onValueChange('פעם ביומיים');
                    else if (v === 'שבוע') onValueChange('פעם בשבוע');
                    else onValueChange(`פעם ב ${v}`);
                  }}
                >
                  <option className="bg-[#1e1e1e]" value="יום">יום</option>
                  <option className="bg-[#1e1e1e]" value="יומיים">יומיים</option>
                  <option className="bg-[#1e1e1e]" value="3 ימים">3 ימים</option>
                  <option className="bg-[#1e1e1e]" value="4 ימים">4 ימים</option>
                  <option className="bg-[#1e1e1e]" value="5 ימים">5 ימים</option>
                  <option className="bg-[#1e1e1e]" value="6 ימים">6 ימים</option>
                  <option className="bg-[#1e1e1e]" value="שבוע">שבוע</option>
                </select>
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
