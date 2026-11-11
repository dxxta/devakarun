import { Suspense } from 'react'
import type { Metadata } from 'next'

import { GallerySection } from '@/components/portfolio/gallery-section'
import { LoadingState } from '@/components/states/loading-state'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Gallery' }

export default function GalleryPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="m-0 text-balance font-display text-4xl font-extrabold sm:text-5xl">Gallery</h1>
        <p className="m-0 max-w-prose text-pretty text-muted-foreground">Screenshots from my projects.</p>
      </header>
      <Suspense fallback={<LoadingState label="Loading gallery…" variant="cards" />}>
        <GallerySection />
      </Suspense>
    </div>
  )
}
