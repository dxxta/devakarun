'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { BlogHeading } from './heading-utils'

function HeadingLinks({ headings, activeID }: { headings: BlogHeading[]; activeID: string | null }) {
  return (
    <ul className="m-0 list-none space-y-1 p-0">
      {headings.map((heading) => (
        <li className={heading.level === 3 ? 'pl-3' : undefined} key={heading.id}>
          <Link
            aria-current={activeID === heading.id ? 'true' : undefined}
            className={`link-underline block rounded-control px-2 py-1 text-sm focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${activeID === heading.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            href={`#${heading.id}`}
          >
            {heading.text}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function TableOfContents({ headings, mode }: { headings: BlogHeading[]; mode: 'desktop' | 'mobile' }) {
  const [activeID, setActiveID] = useState<string | null>(null)
  const activeHeading = headings.find(({ id }) => id === activeID)

  useEffect(() => {
    if (!headings.length || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActiveID(visible[0].target.id)
    }, { rootMargin: '-112px 0px -68% 0px', threshold: 0 })

    headings.forEach(({ id }) => {
      const target = document.getElementById(id)
      if (target) observer.observe(target)
    })

    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  if (mode === 'mobile') {
    return (
      <details
        className="sticky top-[8.75rem] z-30 max-h-[60dvh] overflow-y-auto rounded-card border-2 border-ink-fixed bg-card p-3 shadow-hard lg:hidden"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('a')) event.currentTarget.open = false
        }}
      >
        <summary className="flex cursor-pointer items-center justify-between gap-3 font-display font-bold">
          <span className="shrink-0">On this page</span>
          {activeHeading ? <span className="truncate text-sm font-medium text-muted-foreground">{activeHeading.text}</span> : null}
        </summary>
        <nav aria-label="Table of contents" className="mt-3">
          <HeadingLinks activeID={activeID} headings={headings} />
        </nav>
      </details>
    )
  }

  return (
    <nav aria-label="Table of contents" className="hidden rounded-card border-2 border-ink-fixed bg-card p-4 shadow-hard lg:block">
      <h2 className="mb-3 font-display text-base font-bold">On this page</h2>
      <HeadingLinks activeID={activeID} headings={headings} />
    </nav>
  )
}
