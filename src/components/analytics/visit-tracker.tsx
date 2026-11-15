'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const visibleDelay = 3000

export function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname === '/console' || pathname.startsWith('/console/') || pathname === '/api' || pathname.startsWith('/api/')) return
    if (new URLSearchParams(window.location.search).get('preview') === 'true') return

    const storageKey = `page-visit:${pathname}`
    try {
      if (sessionStorage.getItem(storageKey)) return
    } catch {
      return
    }

    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null
    let interacted = false
    let sent = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const sendVisit = () => {
      if (sent) return
      sent = true
      try { sessionStorage.setItem(storageKey, '1') } catch { /* Storage may be disabled. */ }
      const body = new Blob([JSON.stringify({ path: pathname, preview: false })], { type: 'application/json' })
      if (!navigator.sendBeacon('/api/analytics/visit', body)) {
        void fetch('/api/analytics/visit', { method: 'POST', body, credentials: 'same-origin', keepalive: true })
      }
    }

    const schedule = () => {
      if (!interacted || visibleSince === null || timer || sent) return
      const remaining = Math.max(0, visibleDelay - (Date.now() - visibleSince))
      timer = setTimeout(() => {
        timer = undefined
        if (document.visibilityState === 'visible') sendVisit()
      }, remaining)
    }

    const onInteraction = () => {
      interacted = true
      schedule()
      window.removeEventListener('scroll', onInteraction)
      window.removeEventListener('pointermove', onInteraction)
      window.removeEventListener('keydown', onInteraction)
      window.removeEventListener('touchstart', onInteraction)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        visibleSince = Date.now()
        schedule()
      } else {
        visibleSince = null
        if (timer) clearTimeout(timer)
        timer = undefined
      }
    }

    window.addEventListener('scroll', onInteraction, { passive: true, once: true })
    window.addEventListener('pointermove', onInteraction, { passive: true, once: true })
    window.addEventListener('keydown', onInteraction, { once: true })
    window.addEventListener('touchstart', onInteraction, { passive: true, once: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('scroll', onInteraction)
      window.removeEventListener('pointermove', onInteraction)
      window.removeEventListener('keydown', onInteraction)
      window.removeEventListener('touchstart', onInteraction)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [pathname])

  return null
}
