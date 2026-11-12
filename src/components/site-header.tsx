'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { IconMenu2 } from '@tabler/icons-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SearchDrawer } from '@/components/search/search-drawer'
import { Wordmark } from '@/components/brand/wordmark'

const links = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [containerWidths, setContainerWidths] = useState<{ wide: number; narrow: number } | null>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    const updateScrollState = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setScrolled(window.scrollY > 8)
      })
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateScrollState)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const availableContainer = headerContainerRef.current?.parentElement
    if (!availableContainer) return

    let frame = 0
    const measureWidths = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const availableWidth = availableContainer.getBoundingClientRect().width
        const gutter = availableWidth >= 1024 ? 32 : availableWidth >= 640 ? 24 : 16
        const nextWidths = {
          wide: Math.max(0, availableWidth - gutter * 2),
          narrow: Math.max(0, Math.min(availableWidth - 32, 1152)),
        }
        setContainerWidths((current) =>
          current?.wide === nextWidths.wide && current.narrow === nextWidths.narrow
            ? current
            : nextWidths,
        )
      })
    }

    const observer = new ResizeObserver(measureWidths)
    observer.observe(availableContainer)
    window.addEventListener('resize', measureWidths)
    measureWidths()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measureWidths)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      className="mx-auto w-[calc(100%-2rem)] transition-[width] duration-[450ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-[width] motion-reduce:transition-none sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]"
      ref={headerContainerRef}
      style={containerWidths ? { width: `${scrolled ? containerWidths.narrow : containerWidths.wide}px` } : undefined}
    >
    <header className="flex min-h-16 items-center justify-between gap-3 rounded-full border-2 border-border bg-card px-4 shadow-hard md:px-6">
      <Link
        aria-label="dev.akarun home"
        className="shrink-0"
        href="/"
      >
        <Wordmark className="h-8 w-auto" />
      </Link>

      <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
        {links.map(({ href, label }) => (
          <Link className="font-medium underline-offset-4 hover:underline" href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-1.5">
        <SearchDrawer />
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              aria-label="Open navigation menu"
              className="size-11 rounded-full md:hidden"
              size="icon"
              variant="outline"
            >
              <IconMenu2 aria-hidden="true" className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="w-full border-l-2 border-border bg-background p-5 sm:max-w-sm"
            side="right"
          >
            <SheetHeader className="p-0">
              <SheetTitle className="font-display text-2xl">Menu</SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile navigation" className="mt-6 grid gap-2">
              {links.map(({ href, label }) => (
                <Link
                  className="rounded-control px-3 py-3 text-lg font-semibold hover:bg-muted"
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-5 flex items-center gap-3">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">Change theme</span>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
    </div>
  )
}
