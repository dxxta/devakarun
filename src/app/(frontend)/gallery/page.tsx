import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { GallerySection, GALLERY_PAGE_SIZE, loadGalleryImages } from '@/components/portfolio/gallery-section'
import { LoadingState } from '@/components/states/loading-state'
import { ErrorState } from '@/components/states/error-state'
import { getSiteFeatures } from '@/lib/site-features'
import { absoluteURL } from '@/lib/seo'
import { Suspense } from 'react'

type SearchParams = Record<string, string | string[] | undefined>
const GALLERY_PATH = '/gallery'

function parsePage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : null
}

function pageURL(page: number, searchParams: SearchParams = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page' || value === undefined) continue
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item))
    else query.set(key, value)
  }
  if (page > 1) query.set('page', String(page))
  const search = query.toString()
  return search ? `${GALLERY_PATH}?${search}` : GALLERY_PATH
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { showGallery } = await getSiteFeatures()
  if (!showGallery) return { title: 'Gallery' }

  const params = await searchParams
  const requestedPage = parsePage(params.page) ?? 1

  try {
    const { images } = await loadGalleryImages()
    const totalPages = Math.max(1, Math.ceil(images.length / GALLERY_PAGE_SIZE))
    const page = Math.min(requestedPage, totalPages)
    return {
      title: page > 1 ? `Gallery, page ${page}` : 'Gallery',
      alternates: { canonical: absoluteURL(pageURL(page)) },
      pagination: {
        previous: page > 1 ? absoluteURL(pageURL(page - 1)) : undefined,
        next: page < totalPages ? absoluteURL(pageURL(page + 1)) : undefined,
      },
    }
  } catch {
    return { title: 'Gallery', alternates: { canonical: absoluteURL(GALLERY_PATH) } }
  }
}

export const dynamic = 'force-dynamic'

export default async function GalleryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { showGallery } = await getSiteFeatures()
  if (!showGallery) notFound()

  const params = await searchParams
  const requestedPage = parsePage(params.page)
  if (requestedPage === null) redirect(pageURL(1, params))

  const { images, failed } = await loadGalleryImages()
  if (failed) return <ErrorState title="Gallery could not load" message="Refresh the page to try again." />

  const totalPages = Math.max(1, Math.ceil(images.length / GALLERY_PAGE_SIZE))
  if (requestedPage > totalPages) redirect(pageURL(totalPages, params))

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="m-0 text-balance font-display text-4xl font-extrabold sm:text-5xl">Gallery</h1>
        <p className="m-0 max-w-prose text-pretty text-muted-foreground">Screenshots from my projects.</p>
      </header>
      <Suspense fallback={<LoadingState label="Loading gallery…" variant="cards" />}>
        <GallerySection images={images} page={requestedPage} searchParams={params} />
      </Suspense>
    </div>
  )
}
