import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { countryFromHeaders } from '@/lib/analytics'
import { rateLimit } from '@/lib/rate-limit'
import { getVisitor } from '@/lib/visitor'

export async function recordRejectedContact(reason: 'validation_failed' | 'honeypot' | 'captcha_failed' | 'rate_limited'): Promise<void> {
  try {
    const requestHeaders = await headers()
    const visitor = getVisitor(new Request('http://localhost/contact', { headers: requestHeaders }))
    const limit = rateLimit(`contact-rejected:${visitor.ipHash}`, 30, 60 * 60 * 1000)
    if (!limit.ok) return

    const payload = await getPayload({ config })
    await payload.create({
      collection: 'analytics-events',
      overrideAccess: true,
      data: {
        event: 'contact_rejected',
        path: '/contact',
        country: countryFromHeaders(requestHeaders),
        visitorHash: visitor.visitorHash,
        day: visitor.day,
        reason,
      },
    })
  } catch {
    // Rejection analytics must never change the form response.
  }
}
