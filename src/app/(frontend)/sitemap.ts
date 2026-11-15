import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { absoluteURL } from '@/lib/seo'
import { getSiteFeatures } from '@/lib/site-features'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { showGallery } = await getSiteFeatures()
  const payload = await getPayload({ config })
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-updatedAt',
    depth: 0,
    limit: 1000,
  })

  const routes = ['/', '/about', '/blog', ...(showGallery ? ['/gallery'] : []), '/cookies']
  return [
    ...routes.map((route) => ({ url: absoluteURL(route), changeFrequency: 'weekly' as const })),
    ...posts.map((post) => ({
      url: absoluteURL(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
    })),
  ]
}
