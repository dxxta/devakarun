import type { MetadataRoute } from 'next'

import { AI_CRAWLER_USER_AGENTS } from '@/lib/ai-crawlers'
import { absoluteURL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: absoluteURL('/sitemap.xml'),
  }
}
