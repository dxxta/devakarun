import RSS from 'rss'
import { getPayload } from 'payload'
import config from '@payload-config'
import { absoluteURL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    depth: 0,
    limit: 100,
  })
  const feed = new RSS({
    title: 'dev.akarun Blog',
    description: 'Published posts.',
    feed_url: absoluteURL('/rss.xml'),
    site_url: absoluteURL('/'),
    language: 'en',
  })

  for (const post of posts) {
    feed.item({
      title: post.title,
      description: post.excerpt,
      url: absoluteURL(`/blog/${post.slug}`),
      guid: absoluteURL(`/blog/${post.slug}`),
      date: post.publishedAt || post.createdAt,
      categories: (post.tags ?? []).flatMap((tag) => typeof tag === 'object' && tag ? [tag.name] : []),
    })
  }

  return new Response(feed.xml({ indent: true }), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
  })
}
