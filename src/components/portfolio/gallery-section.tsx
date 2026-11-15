import { getPayload } from 'payload'

import { GalleryLightbox, type GalleryImage } from '@/components/portfolio/gallery-lightbox'
import { Pagination } from '@/components/blog/pagination'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState } from '@/components/states/error-state'
import config from '@payload-config'
import type { Certificate, GalleryImage as GalleryImageDocument, Media, Project } from '@/payload-types'

export const GALLERY_PAGE_SIZE = 12
type SearchParams = Record<string, string | string[] | undefined>

function isPopulatedMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'id' in value && 'url' in value && typeof value.url === 'string' && value.url.trim().length > 0
}

export async function loadGalleryImages(): Promise<{ images: GalleryImage[]; failed: boolean }> {
  let projects: Project[] = []
  let certificates: Certificate[] = []
  let eventPhotos: GalleryImageDocument[] = []

  try {
    const payload = await getPayload({ config })
    const [projectResult, certificateResult, eventResult] = await Promise.all([
      payload.find({ collection: 'projects', sort: 'order', limit: 500, depth: 1 }),
      payload.find({ collection: 'certificates', sort: 'order', limit: 500, depth: 1 }),
      payload.find({ collection: 'gallery-images', sort: 'order', limit: 500, depth: 1 }),
    ])
    projects = projectResult.docs
    eventPhotos = eventResult.docs
    certificates = [...certificateResult.docs].sort((left, right) => {
      const highlightOrder = Number(right.highlighted === true) - Number(left.highlighted === true)
      return highlightOrder || (left.order ?? 0) - (right.order ?? 0)
    })
  } catch {
    return { images: [], failed: true }
  }

  const seenMedia = new Set<number>()
  const images: GalleryImage[] = []

  for (const certificate of certificates) {
    const item = certificate.image
    if (!isPopulatedMedia(item) || seenMedia.has(item.id)) continue
    seenMedia.add(item.id)
    images.push({
      id: item.id,
      url: item.url as string,
      width: item.width ?? 1200,
      height: item.height ?? 900,
      title: certificate.title,
      kind: 'certificate',
      href: certificate.credentialUrl || '/about#certificates-heading',
      external: Boolean(certificate.credentialUrl),
    })
  }

  for (const project of projects) {
    const mediaItems = [project.coverImage, ...(project.gallery ?? [])]
    for (const item of mediaItems) {
      if (!isPopulatedMedia(item) || seenMedia.has(item.id)) continue
      seenMedia.add(item.id)
      images.push({
        id: item.id,
        url: item.url as string,
        width: item.width ?? 1200,
        height: item.height ?? 900,
        title: project.title,
        kind: 'project',
        href: `/projects/${project.slug}`,
      })
    }
  }

  for (const eventPhoto of eventPhotos) {
    const item = eventPhoto.image
    if (!isPopulatedMedia(item) || seenMedia.has(item.id)) continue
    seenMedia.add(item.id)
    images.push({
      id: item.id,
      url: item.url as string,
      width: item.width ?? 1200,
      height: item.height ?? 900,
      title: eventPhoto.title,
      caption: eventPhoto.caption,
      kind: 'event',
    })
  }

  return { images, failed: false }
}

export function GallerySection({
  images,
  page,
  searchParams,
}: {
  images: GalleryImage[]
  page: number
  searchParams: SearchParams
}) {
  if (images.length === 0) {
    return <EmptyState title="No images yet" hint="Project screenshots, certificates, and event photos appear here." />
  }

  const totalPages = Math.max(1, Math.ceil(images.length / GALLERY_PAGE_SIZE))
  const pageImages = images.slice((page - 1) * GALLERY_PAGE_SIZE, page * GALLERY_PAGE_SIZE)

  return (
    <section aria-labelledby="gallery-heading">
      <GalleryLightbox images={pageImages} />
      <Pagination basePath="/gallery" label="Gallery pages" page={page} searchParams={searchParams} totalPages={totalPages} />
    </section>
  )
}
