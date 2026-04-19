'use client'

import { useEffect } from 'react'
import { plants } from '@/lib/plants-data'

const CACHE_NAME = 'plant-images-v1'

/**
 * Preloads all plant and background images into:
 * 1. Browser Cache API (persistent across sessions)
 * 2. In-memory Image objects (instant rendering)
 * 
 * Since the plant count is small and fixed, this is a one-time cost
 * that massively improves carousel swipe smoothness.
 */
export function useImagePreloader() {
  useEffect(() => {
    const allImages = plants.flatMap(p => [p.image, p.backgroundImage])

    // 1. Preload into DOM (triggers browser native cache)
    allImages.forEach(src => {
      const img = new window.Image()
      img.src = src
    })

    // 2. Cache API for offline + instant reload
    if ('caches' in window) {
      caches.open(CACHE_NAME).then(cache => {
        allImages.forEach(async (url) => {
          const cached = await cache.match(url)
          if (!cached) {
            try {
              await cache.add(url)
            } catch {
              // Silently skip if fetch fails
            }
          }
        })
      })
    }
  }, [])
}
