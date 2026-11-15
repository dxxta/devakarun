import { getPayload } from 'payload'
import config from '@payload-config'
import { analyticsLabel, clickEventNames, countryFromHeaders, isBotUserAgent, normalizeAnalyticsPath } from '@/lib/analytics'
import { distinctRateLimit, rateLimit } from '@/lib/rate-limit'
import { getVisitor, isSameOriginRequest } from '@/lib/visitor'

const hour = 60 * 60 * 1000
const acceptedEvents = new Set<string>(clickEventNames)

function noContent(setCookie?: string): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  if (setCookie) headers.set('Set-Cookie', setCookie)
  return new Response(null, { status: 204, headers })
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request) || isBotUserAgent(request.headers.get('user-agent') ?? '') || !request.headers.get('accept-language')) {
    return noContent()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return noContent()
  }
  if (typeof body !== 'object' || body === null || !('event' in body) || typeof body.event !== 'string') return noContent()
  if (!/^[a-z0-9_-]{1,40}$/.test(body.event) || !acceptedEvents.has(body.event)) return noContent()
  const path = normalizeAnalyticsPath('path' in body ? body.path : null)
  if (!path) return noContent()
  const label = analyticsLabel('label' in body ? body.label : undefined)
  if (body.event === 'outbound_link' && label && !/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(label)) return noContent()

  try {
    const visitor = getVisitor(request)
    const ipLimit = rateLimit(`analytics-event:ip:${visitor.ipHash}`, 120, hour)
    const visitorLimit = rateLimit(`analytics-event:visitor:${visitor.visitorHash}`, 30, 60_000)
    if (!ipLimit.ok || !visitorLimit.ok) return noContent(visitor.setCookie)

    const payload = await getPayload({ config })
    await payload.create({
      collection: 'analytics-events',
      overrideAccess: true,
      data: {
        event: body.event,
        path,
        country: countryFromHeaders(request.headers),
        visitorHash: visitor.visitorHash,
        day: visitor.day,
        ...(label ? { label } : {}),
      },
    })
    return noContent(visitor.setCookie)
  } catch {
    return noContent()
  }
}
