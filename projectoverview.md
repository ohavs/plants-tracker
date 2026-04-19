# 🌿 Plant Care Tracker — Project Overview

## Vision
A **high-end, mobile-first** Plant Care Tracker with a luxury UI — built as a Progressive Web App (PWA) that feels native on iOS and Android. The design language emphasizes **Eye Candy**: 3D plant renders, animated mesh gradient backgrounds, glassmorphism cards, and buttery-smooth shared-element transitions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, RSC) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS 4.2 + Custom CSS |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Utilities** | clsx + tailwind-merge (`cn()`) |
| **PWA** | next-pwa + Custom Service Worker |
| **Font** | Heebo (Google Fonts — Hebrew + Latin) |
| **Hosting** | Vercel (planned) |

## Architecture

```
plants/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (RTL, PWA meta, font)
│   ├── page.tsx            # Home — fullscreen plant carousel
│   └── globals.css         # Design tokens, mesh gradient, glass, animations
├── components/
│   ├── plant-carousel.tsx  # Horizontal swipe carousel with 3D renders
│   ├── plant-details.tsx   # Bottom-sheet details with glassmorphism
│   ├── theme-provider.tsx  # next-themes wrapper
│   └── ui/                 # Shadcn UI primitives (trimmed)
├── hooks/
│   ├── use-mobile.ts       # Responsive breakpoint hook
│   └── use-toast.ts        # Toast notification system
├── lib/
│   ├── plants-data.ts      # Static plant data + images
│   └── utils.ts            # cn() utility
├── public/
│   ├── icons/              # PWA icons (72–512px)
│   ├── images/plants/      # 3D plant render PNGs
│   ├── manifest.json       # PWA manifest (RTL, Hebrew)
│   └── sw.js               # Service worker
└── Configuration files (next.config, tsconfig, postcss, etc.)
```

## Design Language

### Colors
- **Background**: Deep forest green (`oklch(0.15 0.03 150)`)
- **Primary**: Emerald (`oklch(0.7 0.15 150)`)
- **Accent**: Warm amber/olive (`oklch(0.65 0.12 80)`)
- Each plant has its own background + accent color palette for the dynamic color morphing

### Animations
- **Mesh Gradient**: Animated multi-point radial gradient overlay
- **Float**: Gentle vertical bobbing for plant renders (4s cycle)
- **Slide Transitions**: Spring-based 3D rotation on carousel swipes
- **Shared Layout**: Plant image morphs between carousel and details view
- **Ripple Effect**: Water button tap feedback

### Typography
- **Font**: Heebo — supports both Hebrew and Latin
- **Direction**: RTL (Right-to-Left) throughout

## PWA Configuration
- **Display**: Standalone (fullscreen, no browser chrome)
- **Orientation**: Portrait locked
- **Theme**: Dark forest green (#1a2f23)
- **Language**: Hebrew (he), RTL
- **Safe Areas**: CSS env() for notch/island devices
- **Service Worker**: Cache-first for assets, network-first for navigation

## Localization
- Full Hebrew UI
- RTL layout baked into `<html>` tag
- All labels, descriptions, and dates in Hebrew

## Roadmap
- [ ] Persist watering data (localStorage → Firebase)
- [ ] Push notification reminders for watering
- [ ] Camera integration for plant photos
- [ ] Growth timeline / progress tracking
- [ ] Multi-user support
- [ ] Plant identification via AI
