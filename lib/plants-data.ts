import { Clock, Droplets, Sun, Leaf, Thermometer, Sprout, Wind, type LucideIcon } from 'lucide-react'

export interface PlantParam {
  key: string
  label: string
  value: string
  icon: string // icon name string for serialization
}

export interface WateringRecord {
  date: string
  userId: string
  userName: string
}

export interface Plant {
  id: string
  name: string
  image: string
  backgroundImage: string
  accentColor: string
  description: string
  purchaseDate?: string // ISO date string, e.g. '2024-03-15'
  // Core params stored as structured list for dynamic rendering
  params: PlantParam[]
  wateringHistory?: WateringRecord[]
}

// Icon map for serialized icon names
export const PARAM_ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  droplets: Droplets,
  sun: Sun,
  leaf: Leaf,
  thermometer: Thermometer,
  sprout: Sprout,
  wind: Wind,
}

export const DEFAULT_PARAM_ICON = 'leaf'

export const plants: Plant[] = [
  {
    id: '1',
    name: 'בזיליקום',
    image: '/images/plants/Basil-tp.webp',
    backgroundImage: '/images/plants-bg/Basil-bg.webp',
    accentColor: 'oklch(0.55 0.15 150)',
    description: 'עשב תבלין ריחני — בסיס לפסטו ולסלטים ים תיכוניים',
    params: [
      { key: 'wateringFrequency', label: 'תדירות השקיה', value: 'פעם בשבוע', icon: 'clock' },
      
      
      { key: 'sunlight', label: 'תאורה', value: 'שמש מלאה', icon: 'sun' },
    ],
  },
  {
    id: '2',
    name: 'נענע',
    image: '/images/plants/Mint-tp.webp',
    backgroundImage: '/images/plants-bg/Mint-bg.webp',
    accentColor: 'oklch(0.6 0.14 160)',
    description: 'צמח תבלין רענן וארומטי, מושלם לתה ולשתייה קרה',
    params: [
      { key: 'wateringFrequency', label: 'תדירות השקיה', value: 'פעם בשבוע', icon: 'clock' },
      
      
      { key: 'sunlight', label: 'תאורה', value: 'שמש חלקית', icon: 'sun' },
    ],
  },
  {
    id: '3',
    name: 'פלפל ירוק',
    image: '/images/plants/Green Pepper-tp.webp',
    backgroundImage: '/images/plants-bg/Green Pepper-bg.webp',
    accentColor: 'oklch(0.5 0.14 130)',
    description: 'ירק גינה קלאסי — פריך, מתוק ועסיסי',
    params: [
      { key: 'wateringFrequency', label: 'תדירות השקיה', value: 'פעמיים בשבוע', icon: 'clock' },
      
      
      { key: 'sunlight', label: 'תאורה', value: 'שמש מלאה', icon: 'sun' },
    ],
  },
  {
    id: '4',
    name: 'אורגנו',
    image: '/images/plants/Oregano-tp.webp',
    backgroundImage: '/images/plants-bg/Oregano-bg.webp',
    accentColor: 'oklch(0.6 0.12 110)',
    description: 'תבלין ים תיכוני עם ניחוח חזק ועמיד',
    params: [
      { key: 'wateringFrequency', label: 'תדירות השקיה', value: 'פעם בשבוע', icon: 'clock' },
      
      
      { key: 'sunlight', label: 'תאורה', value: 'שמש מלאה', icon: 'sun' },
    ],
  },
  {
    id: '5',
    name: 'בזיליקום סגול',
    image: '/images/plants/Red basil-tp.webp',
    backgroundImage: '/images/plants-bg/Red Basil-bg.webp',
    accentColor: 'oklch(0.55 0.15 320)',
    description: 'זן דקורטיבי עם עלים סגולים ויפיפיים וטעם עדין',
    params: [
      { key: 'wateringFrequency', label: 'תדירות השקיה', value: 'פעם בשבוע', icon: 'clock' },
      
      
      { key: 'sunlight', label: 'תאורה', value: 'שמש מלאה', icon: 'sun' },
    ],
  },
  {
    id: '6',
    name: 'זעתר',
    image: "/images/plants/Za'atar-tp.webp",
    backgroundImage: "/images/plants-bg/Za'atar-bg.webp",
    accentColor: 'oklch(0.6 0.13 80)',
    description: 'צמח תבלין מסורתי — הבסיס לתערובת הזעתר הישראלית',
    params: [
      { key: 'wateringFrequency', label: 'תדירות השקיה', value: 'פעם בשבועיים', icon: 'clock' },
      
      
      { key: 'sunlight', label: 'תאורה', value: 'שמש מלאה', icon: 'sun' },
    ],
  },
]
