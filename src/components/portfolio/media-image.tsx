import type { ReactNode } from 'react'

import { CdnImage } from '@/components/portfolio/cdn-image'
import type { Media } from '@/payload-types'
import { cn } from 'cn'

type MediaImageProps = {
  media?: number | Media | null
  alt?: string
  className?: string
  imageClassName?: string
  sizes?: string
  priority?: boolean
  placeholder?: ReactNode
}

function isPopulatedMedia(media: number | Media | null | undefined): media is Media {
  return typeof media === 'object' && media !== null && typeof media.url === 'string'
}

export function MediaImage({
  media,
  alt,
  className,
  imageClassName,
  sizes = '100vw',
  priority = false,
  placeholder,
}: MediaImageProps) {
  if (!isPopulatedMedia(media) || !media.url) {
    return placeholder ? <div className={cn('relative overflow-hidden rounded-card border-2 border-border bg-muted', className)}>{placeholder}</div> : null
  }

  return (
    <figure
      className={cn(
        'relative m-0 overflow-hidden rounded-card border-2 border-border bg-muted',
        className,
      )}
    >
      <CdnImage
        cloudflare={process.env.CLOUDFLARE_IMAGES === 'true'}
        src={media.url}
        alt={alt ?? media.alt}
        width={media.width ?? 1200}
        height={media.height ?? 800}
        sizes={sizes}
        priority={priority}
        className={cn('h-full w-full object-cover', imageClassName)}
      />
    </figure>
  )
}
