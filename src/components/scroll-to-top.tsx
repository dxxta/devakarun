'use client'

import { useEffect, useState } from 'react'
import { IconArrowUp } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    const updateVisibility = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setVisible(window.scrollY > 400)
      })
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateVisibility)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const scrollToTop = () => {
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth'
    const options: ScrollToOptions = { top: 0, behavior }
    window.scrollTo(options)
    document.documentElement.scrollTo(options)
    document.body.scrollTo(options)
  }

  return (
    <div
      aria-hidden={visible ? undefined : true}
      className={`fixed bottom-4 right-4 z-[45] transition-[opacity,transform] duration-200 motion-reduce:translate-y-0 motion-reduce:transition-none ${visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
      style={{
        right: 'max(1rem, env(safe-area-inset-right))',
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <Button
        aria-label="Scroll to top"
        className={`size-11 rounded-full ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={scrollToTop}
        size="icon"
        tabIndex={visible ? 0 : -1}
        type="button"
        variant="outline"
      >
        <IconArrowUp aria-hidden="true" className="size-5" />
      </Button>
    </div>
  )
}
