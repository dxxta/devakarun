import { getPayload } from 'payload'

import { GalleryLightbox, type GalleryImage } from '@/components/portfolio/gallery-lightbox'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState } from '@/components/states/error-state'
import config from '@payload-config'
import type { Certificate, Media, Project } from '@/payload-types'

function isPopulatedMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'id' in value && 'url' in value && typeof value.url === 'string' && value.url.trim().length > 0
}

export async function GallerySection() {
  let projects: Project[] = []
  let certificates: Certificate[] = []
  let hasError = false

  try {
    const payload = await getPayload({ config })
    const [projectResult, certificateResult] = await Promise.all([
      payload.find({ collection: 'projects', sort: 'order', limit: 500, depth: 1 }),
      payload.find({ collection: 'certificates', sort: 'order', limit: 500, depth: 1 }),
    ])
    projects = projectResult.docs
    certificates = [...certificateResult.docs].sort((left, right) => {
      const highlightOrder = Number(right.highlighted === true) - Number(left.highlighted === true)
      return highlightOrder || (left.order ?? 0) - (right.order ?? 0)
    })
  } catch {
    hasError = true
  }

  if (hasError) {
    return <ErrorState title="Gallery could not load" message="Refresh the page to try again." />
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

  if (images.length === 0) {
    return <EmptyState title="No images yet" hint="Project screenshots and certificates appear here." />
  }

  return (
    <section aria-labelledby="gallery-heading">
      <GalleryLightbox images={images} />
    </section>
  )
}
