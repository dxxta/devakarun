'use client'

import { useEffect } from 'react'

const PRESSABLE_SELECTOR = '[data-pressable]'
const NESTED_INTERACTIVE_SELECTOR = 'a, button, input, select, textarea'

export function PressedProvider() {
  useEffect(() => {
    const pointerHosts = new Map<number, { host: HTMLElement; onLeave: () => void }>()
    const keyboardHosts = new Set<HTMLElement>()

    function isDisabled(host: HTMLElement) {
      return host.matches(':disabled, [aria-disabled="true"]')
    }

    function release(host: HTMLElement) {
      if (
        !Array.from(pointerHosts.values()).some(({ host: activeHost }) => activeHost === host) &&
        !keyboardHosts.has(host)
      ) {
        host.removeAttribute('data-pressed')
      }
    }

    function releasePointer(pointerId: number) {
      const active = pointerHosts.get(pointerId)
      if (!active) return
      active.host.removeEventListener('pointerleave', active.onLeave)
      pointerHosts.delete(pointerId)
      release(active.host)
    }

    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Element)) return
      const host = event.target.closest<HTMLElement>(PRESSABLE_SELECTOR)
      if (!host || isDisabled(host)) return

      if (
        event.target === host ||
        !event.target.closest(NESTED_INTERACTIVE_SELECTOR)
      ) {
        releasePointer(event.pointerId)
        host.setAttribute('data-pressed', '')
        const onLeave = () => releasePointer(event.pointerId)
        pointerHosts.set(event.pointerId, { host, onLeave })
        host.addEventListener('pointerleave', onLeave, { once: true })
      }
    }

    function onPointerEnd(event: PointerEvent) {
      releasePointer(event.pointerId)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!(event.target instanceof HTMLElement) || event.repeat) return
      const host = event.target.closest<HTMLElement>(PRESSABLE_SELECTOR)
      if (event.target !== host || !host || isDisabled(host)) return
      if (event.key === 'Enter' || event.key === ' ') {
        keyboardHosts.add(host)
        host.setAttribute('data-pressed', '')
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (!(event.target instanceof HTMLElement)) return
      const host = event.target.closest<HTMLElement>(PRESSABLE_SELECTOR)
      if (event.target !== host || !host || (event.key !== 'Enter' && event.key !== ' ')) return
      keyboardHosts.delete(host)
      release(host)
    }

    function onBlur(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return
      const host = event.target.closest<HTMLElement>(PRESSABLE_SELECTOR)
      if (!host) return
      keyboardHosts.delete(host)
      for (const [pointerId, active] of pointerHosts) {
        if (active.host === host) releasePointer(pointerId)
      }
      release(host)
    }

    function releaseAll() {
      for (const pointerId of pointerHosts.keys()) releasePointer(pointerId)
      for (const host of keyboardHosts) host.removeAttribute('data-pressed')
      keyboardHosts.clear()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointerup', onPointerEnd, true)
    document.addEventListener('pointercancel', onPointerEnd, true)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keyup', onKeyUp, true)
    document.addEventListener('blur', onBlur, true)
    window.addEventListener('blur', releaseAll)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', onPointerEnd, true)
      document.removeEventListener('pointercancel', onPointerEnd, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('keyup', onKeyUp, true)
      document.removeEventListener('blur', onBlur, true)
      window.removeEventListener('blur', releaseAll)
      releaseAll()
    }
  }, [])

  return null
}
