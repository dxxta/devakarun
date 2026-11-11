import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rateLimit } from '@/lib/rate-limit'
import type { Search } from '@/payload-types'

export const dynamic = 'force-dynamic'

const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000
const RESULT_LIMIT = 8
const DEFAULT_LIMIT_PER_TYPE = 50

type Result = { type: 'Post' | 'Project'; title: string; href: string; excerpt: string }

function sanitizeQuery(value: string | null) {
  return (value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)
}

export async function GET(request: Request) {
  const requestHeaders = await headers()
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    || requestHeaders.get('x-real-ip')
    || 'unknown'
  const rate = rateLimit(`site-search:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)

  if (!rate.ok) {
    return Response.json({ results: [] }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) },
    })
  }

  const query = sanitizeQuery(new URL(request.url).searchParams.get('q'))
  try {
    const payload = await getPayload({ config })
    if (query.length < 2) {
      const [posts, projects] = await Promise.all([
        payload.find({
          collection: 'posts',
          where: { _status: { equals: 'published' } },
          depth: 0,
          limit: DEFAULT_LIMIT_PER_TYPE,
          sort: '-publishedAt',
          overrideAccess: true,
          select: { title: true, slug: true, excerpt: true, _status: true },
        }),
        payload.find({
          collection: 'projects',
          depth: 0,
          limit: DEFAULT_LIMIT_PER_TYPE,
          sort: '-createdAt',
          overrideAccess: true,
          select: { title: true, slug: true, summary: true },
        }),
      ])
      const results: Result[] = [
        ...posts.docs
          .filter((post) => post._status === 'published' && post.slug && post.title)
          .map((post) => ({ type: 'Post' as const, title: post.title, href: `/blog/${post.slug}`, excerpt: post.excerpt ?? '' })),
        ...projects.docs
          .filter((project) => project.slug && project.title)
          .map((project) => ({ type: 'Project' as const, title: project.title, href: `/projects/${project.slug}`, excerpt: project.summary ?? '' })),
      ]
      return Response.json({ results })
    }

    const { docs } = await payload.find({
      collection: 'search',
      where: { title: { like: query } },
      depth: 1,
      limit: 50,
      sort: '-priority',
      overrideAccess: true,
    })
    const results: Result[] = []

    for (const item of docs as Search[]) {
      if (results.length >= RESULT_LIMIT) break

      if (item.doc.relationTo === 'posts') {
        const post = typeof item.doc.value === 'number'
          ? await payload.findByID({ collection: 'posts', id: item.doc.value, depth: 0, overrideAccess: true })
          : item.doc.value
        if (post._status !== 'published' || !post.slug || !post.title) continue
        results.push({ type: 'Post', title: post.title, href: `/blog/${post.slug}`, excerpt: post.excerpt ?? '' })
        continue
      }

      const project = typeof item.doc.value === 'number'
        ? await payload.findByID({ collection: 'projects', id: item.doc.value, depth: 0, overrideAccess: true })
        : item.doc.value
      if (!project.slug || !project.title) continue
      results.push({ type: 'Project', title: project.title, href: `/projects/${project.slug}`, excerpt: project.summary ?? '' })
    }

    return Response.json({ results })
  } catch {
    return Response.json({ error: 'Search is unavailable.' }, { status: 500 })
  }
}
