import { getPayload } from 'payload'
import { z } from 'zod'
import config from '@payload-config'
import { rateLimit } from '@/lib/rate-limit'
import { findPublishedPost, getReactionState, isUniqueViolation, reactionTypes } from '@/lib/post-activity'
import { getVisitor, isSameOriginRequest, noStoreJSON } from '@/lib/visitor'

type RouteContext = { params: Promise<{ slug: string }> }
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const bodySchema = z.object({ type: z.enum(reactionTypes) }).strict()

function retryResponse(message: string, retryAfterMs: number, setCookie?: string): Response {
  const response = noStoreJSON({ error: message }, 429, setCookie)
  response.headers.set('Retry-After', String(Math.ceil(retryAfterMs / 1000)))
  return response
}

export async function GET(request: Request, { params }: RouteContext): Promise<Response> {
  const { slug } = await params
  if (!slugPattern.test(slug)) return noStoreJSON({ error: 'Post not found.' }, 404)
  try {
    const payload = await getPayload({ config })
    const post = await findPublishedPost(payload, slug)
    if (!post) return noStoreJSON({ error: 'Post not found.' }, 404)
    const visitor = getVisitor(request)
    const state = await getReactionState(payload, post.id, visitor.visitorHash)
    return noStoreJSON(state, 200, visitor.setCookie)
  } catch {
    return noStoreJSON({ error: 'Reactions could not load.' }, 500)
  }
}

export async function POST(request: Request, { params }: RouteContext): Promise<Response> {
  const { slug } = await params
  if (!slugPattern.test(slug)) return noStoreJSON({ error: 'Post not found.' }, 404)
  if (!isSameOriginRequest(request)) return noStoreJSON({ error: 'This request must come from the same site.' }, 403)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return noStoreJSON({ error: 'Request body must be valid JSON.' }, 400)
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return noStoreJSON({ error: 'Choose a valid reaction.' }, 400)

  try {
    const payload = await getPayload({ config })
    const post = await findPublishedPost(payload, slug)
    if (!post) return noStoreJSON({ error: 'Post not found.' }, 404)

    const visitor = getVisitor(request)
    const ipLimit = rateLimit(`reaction:ip:${visitor.ipHash}`, 30, 60 * 60 * 1000)
    if (!ipLimit.ok) return retryResponse('You have reacted several times recently. Please try again later.', ipLimit.retryAfterMs, visitor.setCookie)
    const visitorLimit = rateLimit(`reaction:visitor:${visitor.visitorHash}`, 10, 60 * 1000)
    if (!visitorLimit.ok) return retryResponse('Please wait a moment before reacting again.', visitorLimit.retryAfterMs, visitor.setCookie)

    const existing = await payload.find({
      collection: 'post-reactions',
      where: {
        and: [
          { post: { equals: post.id } },
          { type: { equals: parsed.data.type } },
          { visitorHash: { equals: visitor.visitorHash } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      await payload.delete({ collection: 'post-reactions', id: existing.docs[0].id, overrideAccess: true })
    } else {
      try {
        await payload.create({
          collection: 'post-reactions',
          data: { post: post.id, type: parsed.data.type, visitorHash: visitor.visitorHash },
          overrideAccess: true,
        })
      } catch (error) {
        if (!isUniqueViolation(error)) throw error
        const raced = await payload.find({
          collection: 'post-reactions',
          where: {
            and: [
              { post: { equals: post.id } },
              { type: { equals: parsed.data.type } },
              { visitorHash: { equals: visitor.visitorHash } },
            ],
          },
          limit: 1,
          overrideAccess: true,
        })
        if (raced.docs[0]) await payload.delete({ collection: 'post-reactions', id: raced.docs[0].id, overrideAccess: true })
      }
    }

    const state = await getReactionState(payload, post.id, visitor.visitorHash)
    return noStoreJSON(state, 200, visitor.setCookie)
  } catch {
    return noStoreJSON({ error: 'Your reaction could not be saved.' }, 500)
  }
}
