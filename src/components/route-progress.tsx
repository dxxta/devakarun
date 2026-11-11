'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = `${pathname}?${searchParams.toString()}`
  const previousRoute = useRef(routeKey)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const trickleTimer = useRef<number | null>(null)
  const finishTimer = useRef<number | null>(null)

  const stopTimers = useCallback(() => {
    if (trickleTimer.current !== null) window.clearInterval(trickleTimer.current)
    if (finishTimer.current !== null) window.clearTimeout(finishTimer.current)
    trickleTimer.current = null
    finishTimer.current = null
  }, [])

  const start = useCallback(() => {
    stopTimers()
    setVisible(true)
    setProgress(reducedMotion ? 100 : 12)

    if (!reducedMotion) {
      trickleTimer.current = window.setInterval(() => {
        setProgress((current) => current >= 85 ? current : Math.min(85, current + Math.max(1, (85 - current) * 0.08)))
      }, 180)
      finishTimer.current = window.setTimeout(() => {
        stopTimers()
        setProgress(100)
        finishTimer.current = window.setTimeout(() => {
          setVisible(false)
          setProgress(0)
          finishTimer.current = null
        }, 220)
      }, 9000)
    }
  }, [reducedMotion, stopTimers])

  const complete = useCallback(() => {
    if (!visible) return
    stopTimers()
    setProgress(100)
    finishTimer.current = window.setTimeout(() => {
      setVisible(false)
      setProgress(0)
      finishTimer.current = null
    }, reducedMotion ? 0 : 180)
  }, [reducedMotion, stopTimers, visible])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (pathname.startsWith('/admin')) return

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('target') || anchor.hasAttribute('download')) return

      try {
        const destination = new URL(anchor.href)
        if (destination.origin !== window.location.origin) return
        if (destination.pathname === window.location.pathname && destination.search === window.location.search) return
        start()
      } catch {
        // Ignore malformed or non-navigation hrefs.
      }
    }

    const onPopState = () => start()
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [pathname, start])

  useEffect(() => {
    if (previousRoute.current !== routeKey) {
      previousRoute.current = routeKey
      complete()
    }
  }, [complete, routeKey])

  useEffect(() => () => stopTimers(), [stopTimers])

  if (pathname.startsWith('/admin')) return null

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 left-0 z-[100] h-[3px] w-full ${reducedMotion ? '' : 'transition-opacity duration-200'} ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
        style={{
          width: `${progress}%`,
          transition: reducedMotion ? 'none' : 'width 180ms ease-out',
        }}
      />
    </div>
  )
}
