'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { IconX } from '@tabler/icons-react'

import { MediaImage } from '@/components/portfolio/media-image'
import { Button } from '@/components/ui/button'
import type { Media } from '@/payload-types'
import { cn } from 'cn'

type PreviewableImageProps = {
  media: Media
  alt?: string
  caption?: string
  className?: string
  imageClassName?: string
  sizes?: string
  priority?: boolean
}

export function PreviewableImage({
  media,
  alt,
  caption,
  className,
  imageClassName,
  sizes = '100vw',
  priority = false,
}: PreviewableImageProps) {
  const [open, setOpen] = useState(false)
  const imageAlt = alt ?? media.alt
  const imageCaption = caption ?? imageAlt

  if (!media.url) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          aria-label="View image larger"
          className={cn('block w-full cursor-zoom-in rounded-card text-left focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink', className)}
          data-pressable="card"
          type="button"
        >
          <MediaImage
            alt={imageAlt}
            className="h-full w-full"
            imageClassName={cn('h-full w-full', imageClassName)}
            media={media}
            priority={priority}
            sizes={sizes}
          />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/80 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-3 z-50 m-auto flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-6xl flex-col items-center justify-center gap-4 rounded-card border-2 border-ink-fixed bg-card p-4 shadow-hard focus:outline-none sm:inset-6 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:p-6"
        >
          <DialogPrimitive.Title className="sr-only">{imageCaption}</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <Button aria-label="Close image preview" className="absolute top-3 right-3 z-10 size-10 p-0" size="icon" variant="quiet">
              <IconX aria-hidden="true" className="size-5" />
            </Button>
          </DialogPrimitive.Close>
          <Image
            alt={imageAlt}
            className="max-h-[calc(100dvh-9rem)] min-h-0 max-w-full object-contain"
            height={media.height ?? 1200}
            sizes="90vw"
            src={media.url}
            unoptimized
            width={media.width ?? 1200}
          />
          {imageCaption ? <p className="m-0 max-w-prose text-center text-sm text-muted-foreground">{imageCaption}</p> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
