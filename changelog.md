# 📝 Changelog

All notable changes to the Plant Care Tracker will be documented in this file.

---

## [0.1.0] — 2026-04-19

### 🎯 Initial Import & Environment Setup

**Import from v0/Lovable → Full-scale development in Antigravity**

#### Code Audit & Cleanup
- Removed **40+ unused Shadcn UI components** (accordion, chart, sidebar, menubar, etc.)
- Deleted legacy `styles/globals.css` (duplicate boilerplate with light/dark theme)
- Removed duplicate hooks (`components/ui/use-toast.ts`, `components/ui/use-mobile.tsx`)
- Cleaned placeholder assets from `public/` (placeholder-logo, placeholder-user, etc.)
- Reorganized plant render PNGs from project root → `public/images/plants/`

#### Dependency Cleanup
- Removed **20+ unused dependencies**: `@hookform/resolvers`, `react-hook-form`, `zod`, `recharts`, `react-resizable-panels`, `embla-carousel-react`, `cmdk`, `input-otp`, `date-fns`, `react-day-picker`, and many Radix UI packages
- Added `next-pwa` for PWA capabilities
- Verified: `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge` all present

#### PWA Infrastructure
- Created `public/manifest.json` with RTL Hebrew configuration
- Created `public/sw.js` custom service worker (cache-first assets, network-first navigation)
- Generated PWA icon set (72px – 512px) from custom-designed app icon
- Updated `next.config.mjs` with `next-pwa` integration
- Added full PWA meta tags to `app/layout.tsx` (apple-web-app, viewport-fit: cover)
- Removed `generator: 'v0.app'` meta tag

#### UI Enhancements
- **Plant Carousel**: Now uses real 3D plant render images (PNG) via `next/image`
- **Plant Data**: Updated from generic plants to match actual renders (Basil, Mint, Green Pepper, Oregano, Red Basil, Za'atar)
- **Mesh Gradient**: Added animated multi-point radial gradient background overlay
- **Radial Glow**: Pulsing accent-colored glow behind active plant
- **Navigation Dots**: Upgraded to pill-shaped animated indicators
- **3D Transitions**: Added rotateY to carousel slide animations
- **Glassmorphism**: Enhanced with box-shadow, saturation boost, better border

#### RTL Support
- Confirmed `<html lang="he" dir="rtl">` in root layout
- Fixed card animation direction for RTL (x: 20 → x: -20 corrected)
- Added `text-align: right` default to body
- All labels and descriptions in Hebrew

#### Mobile Optimization
- Safe area CSS variables for notch/island devices
- PWA standalone mode padding adjustments
- iOS tap highlight removal
- Touch-optimized gesture handling
- `100dvh` layout for consistent mobile viewport

#### Documentation
- Created `projectoverview.md` — architecture, tech stack, design language
- Created `changelog.md` — this file
