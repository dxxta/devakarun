'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'
import config from '@/payload.config'
import { sendNewsletterConfirmation } from '@/lib/email'
import { env } from '@/lib/env'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

const emailSchema = z.string().trim().email().max(254)

async function clientIP(): Promise<string> {
  try {
    const requestHeaders = await headers()
    return requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

function newToken(): string {
  return randomBytes(32).toString('hex')
}

type ActionResult = { success: boolean; message: string }

export async function subscribe(emailInput: string, turnstileToken: string | null): Promise<ActionResult> {
  const parsedEmail = emailSchema.safeParse(emailInput)
  if (!parsedEmail.success) return { success: false, message: 'Enter a valid email address.' }
  const ip = await clientIP()
  if (!await verifyTurnstile(turnstileToken, ip)) {
    return { success: false, message: 'Security check failed. Please try again.' }
  }
  const limit = rateLimit(`newsletter:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.ok) return { success: false, message: 'Too many requests. Please try again later.' }

  const payload = await getPayload({ config: await config })
  const email = parsedEmail.data.toLowerCase()
  const existing = await payload.find({
    collection: 'subscribers',
    overrideAccess: true,
    limit: 1,
    where: { email: { equals: email } },
  })
  if (existing.docs[0]?.status === 'confirmed') {
    return { success: true, message: 'This email is already subscribed.' }
  }

  const confirmToken = newToken()
  const unsubscribeToken = newToken()
  if (existing.docs[0]) {
    await payload.update({
      collection: 'subscribers',
      id: existing.docs[0].id,
      overrideAccess: true,
      data: { status: 'pending', confirmToken, unsubscribeToken },
    })
  } else {
    await payload.create({
      collection: 'subscribers',
      overrideAccess: true,
      data: { email, status: 'pending', confirmToken, unsubscribeToken },
    })
  }

  const confirmationURL = new URL('/newsletter/confirm', env.NEXT_PUBLIC_SITE_URL)
  confirmationURL.searchParams.set('token', confirmToken)
  const unsubscribeURL = new URL('/newsletter/unsubscribe', env.NEXT_PUBLIC_SITE_URL)
  unsubscribeURL.searchParams.set('token', unsubscribeToken)
  try {
    await sendNewsletterConfirmation(payload, email, confirmationURL.toString(), unsubscribeURL.toString())
  } catch {
    // Keep the pending record; the user can request another confirmation.
    console.error('Could not send newsletter confirmation email')
  }
  return { success: true, message: 'Check your inbox to confirm your subscription.' }
}

export async function confirmSubscription(token: string): Promise<ActionResult> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { success: false, message: 'This confirmation link is invalid or expired.' }
  const payload = await getPayload({ config: await config })
  const match = await payload.find({
    collection: 'subscribers', overrideAccess: true, limit: 1,
    where: { confirmToken: { equals: token }, status: { equals: 'pending' } },
  })
  const subscriber = match.docs[0]
  if (!subscriber) return { success: false, message: 'This confirmation link is invalid or expired.' }
  await payload.update({
    collection: 'subscribers', id: subscriber.id, overrideAccess: true,
    data: { status: 'confirmed', confirmToken: null },
  })
  return { success: true, message: 'Your subscription is confirmed.' }
}

export async function unsubscribe(token: string): Promise<ActionResult> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { success: false, message: 'This unsubscribe link is invalid or expired.' }
  const payload = await getPayload({ config: await config })
  const match = await payload.find({
    collection: 'subscribers', overrideAccess: true, limit: 1,
    where: { unsubscribeToken: { equals: token }, status: { not_equals: 'unsubscribed' } },
  })
  const subscriber = match.docs[0]
  if (!subscriber) return { success: false, message: 'This unsubscribe link is invalid or expired.' }
  await payload.update({
    collection: 'subscribers', id: subscriber.id, overrideAccess: true,
    data: { status: 'unsubscribed', unsubscribeToken: null, confirmToken: null },
  })
  return { success: true, message: 'You have been unsubscribed.' }
}
