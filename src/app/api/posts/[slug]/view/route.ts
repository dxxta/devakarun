import { getPayload } from 'payload'
import config from '@payload-config'
import { distinctRateLimit, rateLimit } from '@/lib/rate-limit'
import { countPostViews, findPublishedPost, isUniqueViolation } from '@/lib/post-activity'
import { getVisitor, isSameOriginRequest, noStoreJSON } from '@/lib/visitor'
import { countryFromHeaders, isBotUserAgent } from '@/lib/analytics'

type RouteContext = { params: Promise<{ slug: string }> }
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const dayWindow = 24 * 60 * 60 * 1000

export async function POST(request: Request, { params }: RouteContext): Promise<Response> {
  const { slug } = await params
  if (!slugPattern.test(slug)) return noStoreJSON({ counted: false, error: 'Post not found.' }, 404)
  if (!isSameOriginRequest(request)) return noStoreJSON({ counted: false, error: 'This request must come from the same site.' }, 403)

  try {
    const payload = await getPayload({ config })
    const post = await findPublishedPost(payload, slug)
    if (!post) return noStoreJSON({ counted: false, error: 'Post not found.' }, 404)
    const views = () => countPostViews(payload, post.id)
    const url = new URL(request.url)
    const agent = request.headers.get('user-agent') ?? ''
    if (url.searchParams.get('preview') === 'true' || isBotUserAgent(agent) || !request.headers.get('accept-language')) {
      return noStoreJSON({ counted: false, views: await views() })
    }

    const payloadAuth = await payload.auth({ headers: request.headers })
    if (payloadAuth.user) return noStoreJSON({ counted: false, views: await views() })

    const visitor = getVisitor(request)
    const existing = await payload.find({
      collection: 'post-views',
      where: { and: [
        { post: { equals: post.id } },
        { visitorHash: { equals: visitor.visitorHash } },
        { day: { equals: visitor.day } },
      ] },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) return noStoreJSON({ counted: false, views: await views() }, 200, visitor.setCookie)

    const ipLimit = rateLimit(`view:ip:${visitor.ipHash}`, 60, 60 * 60 * 1000)
    if (!ipLimit.ok) return noStoreJSON({ counted: false, views: await views() }, 200, visitor.setCookie)
    const distinctPostLimit = distinctRateLimit(`view:ip-posts:${visitor.ipHash}`, String(post.id), 20, dayWindow)
    if (!distinctPostLimit.ok) return noStoreJSON({ counted: false, views: await views() }, 200, visitor.setCookie)

    try {
      await payload.create({
        collection: 'post-views',
        data: { post: post.id, visitorHash: visitor.visitorHash, day: visitor.day, country: countryFromHeaders(request.headers) },
        overrideAccess: true,
      })
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
      return noStoreJSON({ counted: false, views: await views() }, 200, visitor.setCookie)
    }

    return noStoreJSON({ counted: true, views: await views() }, 200, visitor.setCookie)
  } catch {
    return noStoreJSON({ counted: false, error: 'View could not be recorded.' }, 500)
  }
}
