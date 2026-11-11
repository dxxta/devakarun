'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PaginatedGrid } from '@/components/portfolio/paginated-grid'

export type GalleryImage = {
  id: number
  url: string
  width: number
  height: number
  title: string
  kind: 'project' | 'certificate' | 'showcase'
  href?: string
  external?: boolean
}

export function GalleryLightbox({
  images,
  variant = 'gallery',
  pageSize = 4,
  columns = 2,
}: {
  images: GalleryImage[]
  variant?: 'gallery' | 'showcase'
  pageSize?: number
  columns?: 2 | 3
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeImage = activeIndex === null ? null : images[activeIndex]

  function moveImage(direction: -1 | 1) {
    if (activeIndex === null) return
    setActiveIndex((activeIndex + direction + images.length) % images.length)
  }

  return (
    <DialogPrimitive.Root open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
      {variant === 'showcase' ? (
        <PaginatedGrid columns={columns} label="Portfolio showcase pages" pageSize={pageSize}>
          {images.map((image, index) => (
            <DialogPrimitive.Trigger asChild key={image.id} onClick={() => setActiveIndex(index)}>
              <button
                aria-label={`View ${image.title} portfolio page`}
                className="group relative aspect-[4/3] min-w-0 overflow-hidden rounded-card border-2 border-border bg-muted text-left focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                data-pressable="card"
                type="button"
              >
                <Image
                  alt={`${image.title} portfolio page`}
                  className="pointer-events-none h-full w-full object-contain"
                  height={image.height}
                  loading="lazy"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  src={image.url}
                  width={image.width}
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                />
              </button>
            </DialogPrimitive.Trigger>
          ))}
        </PaginatedGrid>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <DialogPrimitive.Trigger asChild key={image.id} onClick={() => setActiveIndex(index)}>
              <button
                aria-label={`View ${image.title} screenshot`}
                className="group relative aspect-[4/3] min-w-0 overflow-hidden rounded-card border-2 border-border bg-muted text-left focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                data-pressable="card"
                type="button"
              >
                <Image
                  alt={`${image.title} screenshot`}
                  className={`pointer-events-none h-full w-full ${image.kind === 'certificate' || image.kind === 'showcase' ? 'object-contain' : 'object-cover'}`}
                  height={image.height}
                  loading="lazy"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  src={image.url}
                  width={image.width}
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                />
                {image.kind === 'certificate' ? (
                  <Badge className="pointer-events-none absolute top-3 left-3" variant="secondary">Certificate</Badge>
                ) : null}
              </button>
            </DialogPrimitive.Trigger>
          ))}
        </div>
      )}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/80 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-3 z-50 m-auto flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-6xl flex-col items-center justify-center gap-4 rounded-card border-2 border-border bg-card p-4 shadow-hard focus:outline-none sm:inset-6 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:p-6"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              moveImage(-1)
            } else if (event.key === 'ArrowRight') {
              event.preventDefault()
              moveImage(1)
            }
          }}
        >
          <DialogPrimitive.Title className="sr-only">{activeImage?.title ?? 'Project screenshot'}</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <Button aria-label="Close gallery image" className="absolute top-3 right-3 z-10 size-10 rounded-full p-0" size="icon" variant="quiet">
              <IconX aria-hidden="true" className="size-5" />
            </Button>
          </DialogPrimitive.Close>
          {activeImage ? (
            <>
              <div className="flex min-h-0 w-full flex-1 items-center justify-center gap-2">
                <Button aria-label="Previous image" className="size-10 rounded-full p-0" onClick={() => moveImage(-1)} size="icon" variant="quiet">
                  <IconChevronLeft aria-hidden="true" />
                </Button>
                <Image
                alt={activeImage.kind === 'showcase' ? `${activeImage.title} portfolio page` : `${activeImage.title} screenshot`}
                  className="max-h-[85vh] min-h-0 max-w-[calc(100%-5rem)] object-contain"
                  height={activeImage.height}
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                  sizes="90vw"
                  src={activeImage.url}
                  unoptimized
                  width={activeImage.width}
                />
                <Button aria-label="Next image" className="size-10 rounded-full p-0" onClick={() => moveImage(1)} size="icon" variant="quiet">
                  <IconChevronRight aria-hidden="true" />
                </Button>
              </div>
              {activeImage.kind === 'showcase' ? (
                <span className="font-display font-bold">{activeImage.title}</span>
              ) : activeImage.external && activeImage.href ? (
                <a className="font-display font-bold underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" href={activeImage.href} rel="noopener noreferrer" target="_blank">
                  {activeImage.title}
                </a>
              ) : activeImage.href ? (
                <Link className="font-display font-bold underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" href={activeImage.href}>
                  {activeImage.title}
                </Link>
              ) : null}
            </>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
