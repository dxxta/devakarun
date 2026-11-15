import { getPayload } from 'payload'
import config from '@payload-config'
import { distinctRateLimit, rateLimit } from '@/lib/rate-limit'
import { countryFromHeaders, isBotUserAgent, normalizeAnalyticsPath } from '@/lib/analytics'
import { isUniqueViolation } from '@/lib/post-activity'
import { getVisitor, isSameOriginRequest, noStoreJSON } from '@/lib/visitor'

const hour = 60 * 60 * 1000

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) return noStoreJSON({ counted: false }, 403)
  if (isBotUserAgent(request.headers.get('user-agent') ?? '') || !request.headers.get('accept-language')) {
    return noStoreJSON({ counted: false })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return noStoreJSON({ counted: false }, 400)
  }
  if (typeof body !== 'object' || body === null || !('path' in body)) return noStoreJSON({ counted: false }, 400)
  const path = normalizeAnalyticsPath(body.path)
  if (!path || ('preview' in body && body.preview === true) || new URL(request.url).searchParams.get('preview') === 'true') {
    return noStoreJSON({ counted: false })
  }

  try {
    const payload = await getPayload({ config })
    const auth = await payload.auth({ headers: request.headers })
    if (auth.user) return noStoreJSON({ counted: false })

    const visitor = getVisitor(request)
    const ipLimit = rateLimit(`analytics-visit:ip:${visitor.ipHash}`, 120, hour)
    const visitorLimit = rateLimit(`analytics-visit:visitor:${visitor.visitorHash}`, 30, 60_000)
    if (!ipLimit.ok || !visitorLimit.ok) return noStoreJSON({ counted: false }, 200, visitor.setCookie)

    const existing = await payload.find({
      collection: 'page-visits',
      where: { and: [
        { path: { equals: path } },
        { visitorHash: { equals: visitor.visitorHash } },
        { day: { equals: visitor.day } },
      ] },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) return noStoreJSON({ counted: false }, 200, visitor.setCookie)

    const referer = request.headers.get('referer')
    let referrerHost: string | undefined
    if (referer) {
      try {
        referrerHost = new URL(referer).hostname || undefined
      } catch {
        referrerHost = undefined
      }
    }

    try {
      await payload.create({
        collection: 'page-visits',
        overrideAccess: true,
        data: {
          path,
          country: countryFromHeaders(request.headers),
          visitorHash: visitor.visitorHash,
          day: visitor.day,
          ...(referrerHost ? { referrerHost } : {}),
        },
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        return noStoreJSON({ counted: false }, 200, visitor.setCookie)
      }
      throw error
    }
    return noStoreJSON({ counted: true }, 200, visitor.setCookie)
  } catch {
    return noStoreJSON({ counted: false }, 500)
  }
}
