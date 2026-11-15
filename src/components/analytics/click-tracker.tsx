'use client'

import { useEffect } from 'react'

export function ClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const target = event.target.closest<HTMLElement>('[data-track]')
      const eventName = target?.dataset.track
      if (!target || !eventName) return
      const payload = {
        event: eventName,
        label: target.dataset.trackLabel,
        path: window.location.pathname,
      }
      const body = new Blob([JSON.stringify(payload)], { type: 'application/json' })
      if (!navigator.sendBeacon('/api/analytics/event', body)) {
        void fetch('/api/analytics/event', {
          method: 'POST',
          body,
          credentials: 'same-origin',
          keepalive: true,
        })
      }
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
