'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { z } from 'zod'
import { auth } from '@/auth'
import { env } from '@/lib/env'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import config from '@payload-config'

const commentSchema = z.object({
  postId: z.number().int().positive(),
  parentId: z.number().int().positive().nullable(),
  body: z.string().trim().min(1).max(2000),
  turnstileToken: z.string().trim().min(1).nullable(),
})

function relationID(value: number | { id: number } | null | undefined): number | null {
  if (typeof value === 'number') return value
  return value?.id ?? null
}

export async function addComment(
  postId: number,
  parentId: number | null,
  body: string,
  turnstileToken: string | null,
): Promise<void> {
  const session = await auth()
  const commenterId = Number(session?.user?.id)
  if (!Number.isSafeInteger(commenterId) || commenterId <= 0) throw new Error('Sign in to comment.')

  const parsed = commentSchema.safeParse({ postId, parentId, body, turnstileToken })
  if (!parsed.success) throw new Error('Enter a comment of up to 2,000 characters and complete the verification.')

  const requestHeaders = await headers()
  const ip = requestHeaders.get('x-real-ip') || requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (!await verifyTurnstile(parsed.data.turnstileToken, ip)) throw new Error('Verification failed. Please try again.')

  const limit = rateLimit(`commenter:${commenterId}`, 5, 10 * 60 * 1000)
  if (!limit.ok) throw new Error('You have sent several comments recently. Please try again later.')

  const payload = await getPayload({ config })
  const post = await payload.findByID({ collection: 'posts', id: parsed.data.postId, overrideAccess: true })
  if (post._status !== 'published') throw new Error('Comments are only open on published posts.')

  if (parsed.data.parentId !== null) {
    const parent = await payload.findByID({ collection: 'comments', id: parsed.data.parentId, overrideAccess: true })
    if (parent.status !== 'approved' || parent.parent || relationID(parent.post) !== post.id) {
      throw new Error('Choose an approved comment in this post to reply to.')
    }
  }

  const commenter = await payload.findByID({ collection: 'commenters', id: commenterId, overrideAccess: true })
  await payload.create({
    collection: 'comments',
    overrideAccess: true,
    data: {
      post: post.id,
      parent: parsed.data.parentId ?? undefined,
      commenter: commenter.id,
      authorName: commenter.name,
      body: parsed.data.body,
      status: 'pending',
    },
  })

  if (env.CONTACT_TO) {
    try {
      await payload.sendEmail({
        to: env.CONTACT_TO,
        subject: `New comment on ${post.title}`,
        text: `A new comment from ${commenter.name} is waiting for approval on “${post.title}”.\n\n${parsed.data.body}\n\nReview it in Payload Admin.`,
      })
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Could not send the new comment notification.' })
    }
  }

  revalidatePath(`/blog/${post.slug}`)
}
