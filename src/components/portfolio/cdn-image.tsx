'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

import { cloudflareLoader } from '@/lib/image-loaders'

// Once Cloudflare rejects a transformation (error 9422 after the monthly quota),
// every later image on this page session goes straight to the Next.js optimizer.
let cloudflareFailed = false

type CdnImageProps = Omit<ImageProps, 'loader'> & { cloudflare?: boolean }

export function CdnImage({ cloudflare = false, onError, unoptimized, ...props }: CdnImageProps) {
  const [failed, setFailed] = useState(false)
  const useCloudflare = cloudflare && !failed && !cloudflareFailed && !unoptimized

  return (
    <Image
      {...props}
      loader={useCloudflare ? cloudflareLoader : undefined}
      onError={(event) => {
        if (useCloudflare) {
          cloudflareFailed = true
          setFailed(true)
          return
        }
        onError?.(event)
      }}
      unoptimized={unoptimized}
    />
  )
}
