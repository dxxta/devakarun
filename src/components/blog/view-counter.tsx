'use client'

import { useEffect, useState } from 'react'

const visibleDelay = 8000
const numberFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export function ViewCounter({ slug, initialCount }: { slug: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const storageKey = `post-view:${slug}`
    try {
      if (sessionStorage.getItem(storageKey)) return
    } catch {
      return
    }

    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null
    let timer: ReturnType<typeof setTimeout> | undefined
    let interacted = false
    let sent = false

    const sendView = async () => {
      if (sent) return
      sent = true
      try { sessionStorage.setItem(storageKey, '1') } catch { /* Storage may be disabled. */ }
      try {
        const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          keepalive: true,
        })
        if (!response.ok) return
        const result = await response.json() as { views?: number }
        if (typeof result.views === 'number') setCount(result.views)
      } catch {
        // View tracking is best-effort and must not interrupt reading.
      }
    }

    const schedule = () => {
      if (!interacted || visibleSince === null || timer || sent) return
      const remaining = Math.max(0, visibleDelay - (Date.now() - visibleSince))
      timer = setTimeout(() => {
        timer = undefined
        if (document.visibilityState === 'visible') void sendView()
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
  }, [slug])

  return <span> · {numberFormat.format(count)} views</span>
}
