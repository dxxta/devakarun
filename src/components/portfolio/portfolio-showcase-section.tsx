import Link from 'next/link'
import { getPayload } from 'payload'
import { IconDownload } from '@tabler/icons-react'
import config from '@payload-config'
import { ErrorState } from '@/components/states/error-state'
import { EmptyState } from '@/components/states/empty-state'
import { GalleryLightbox, type GalleryImage } from '@/components/portfolio/gallery-lightbox'
import { Button } from '@/components/ui/button'
import type { Media, PortfolioShowcase, Profile } from '@/payload-types'

type PortfolioShowcaseSectionProps = { featuredOnly?: boolean }

function isPopulatedMedia(value: unknown): value is Media & { url: string } {
  return typeof value === 'object' && value !== null && 'url' in value && typeof value.url === 'string' && value.url.trim().length > 0
}

export async function PortfolioShowcaseSection({ featuredOnly = false }: PortfolioShowcaseSectionProps) {
  let showcases: PortfolioShowcase[] = []
  let hasError = false
  let portfolioPdfUrl: string | undefined

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'portfolio-showcases',
      where: featuredOnly ? { featured: { equals: true } } : undefined,
      sort: 'order',
      limit: featuredOnly ? 3 : 100,
      depth: 1,
    })
    showcases = [...result.docs].sort((left, right) => {
      const featuredOrder = Number(right.featured === true) - Number(left.featured === true)
      if (featuredOrder !== 0) return featuredOrder

      if (left.featured === true && right.featured === true) {
        const priority = (showcase: PortfolioShowcase) => {
          const projectTitle = typeof showcase.project === 'object' && showcase.project !== null
            ? showcase.project.title
            : ''
          const searchableTitle = `${showcase.title} ${projectTitle}`.toLowerCase()
          const index = ['slipakar', 'byecheating', 'fundconn'].findIndex((name) => searchableTitle.includes(name))
          return index === -1 ? 3 : index
        }
        const priorityOrder = priority(left) - priority(right)
        if (priorityOrder !== 0) return priorityOrder
      }

      return (left.order ?? 0) - (right.order ?? 0)
    })
  } catch {
    hasError = true
  }

  if (hasError) {
    return <ErrorState title="Portfolio showcase could not load" message="Refresh the page to try again." />
  }

  if (showcases.length === 0 && featuredOnly) return null

  if (!featuredOnly) {
    try {
      const payload = await getPayload({ config })
      const profile: Profile = await payload.findGlobal({ slug: 'profile', depth: 1 })
      if (isPopulatedMedia(profile.portfolioPdf)) portfolioPdfUrl = profile.portfolioPdf.url
    } catch {
      portfolioPdfUrl = undefined
    }
  }

  const images: GalleryImage[] = showcases.flatMap((showcase) => {
    if (!isPopulatedMedia(showcase.image)) return []
    return [{
      id: showcase.id,
      url: showcase.image.url,
      width: showcase.image.width ?? 1400,
      height: showcase.image.height ?? 990,
      title: showcase.title,
      kind: 'showcase',
    }]
  })

  const heading = featuredOnly ? 'Featured showcase' : 'Portfolio showcase'
  const headingId = featuredOnly ? 'featured-showcase-heading' : 'portfolio-showcase-heading'

  return (
    <section aria-labelledby={headingId} className="grid min-w-0 scroll-mt-28 gap-5" id={featuredOnly ? undefined : 'showcase'}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 scroll-mt-28 font-display text-2xl font-bold" id={headingId}>{heading}</h2>
        {!featuredOnly && portfolioPdfUrl ? (
          <Button asChild>
            <a download href={portfolioPdfUrl}>
              <IconDownload aria-hidden="true" className="size-4" />
              Download PDF
            </a>
          </Button>
        ) : null}
      </div>
      {images.length > 0 ? (
        <GalleryLightbox
          columns={featuredOnly ? 3 : 2}
          images={images}
          pageSize={4}
          variant="showcase"
        />
      ) : (
        <EmptyState title="No showcase pages yet" hint="Portfolio pages added in Payload will appear here." />
      )}
      {featuredOnly ? (
        <div className="flex justify-start">
          <Button asChild variant="quiet">
            <Link href="/about#showcase">View all showcase</Link>
          </Button>
        </div>
      ) : null}
    </section>
  )
}
