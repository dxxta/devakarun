'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { z } from 'zod'
import config from '@/payload.config'
import { sendContactNotice } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(10000),
  turnstileToken: z.string().min(1).nullable().optional(),
  website: z.string().optional(),
})

async function clientIP(): Promise<string> {
  try {
    const requestHeaders = await headers()
    return requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function submitContactMessage(input: unknown): Promise<{ success: boolean; message: string }> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: 'Check the form fields and try again.' }
  if (parsed.data.website?.trim()) return { success: false, message: 'Unable to send your message.' }

  const ip = await clientIP()
  if (!await verifyTurnstile(parsed.data.turnstileToken ?? null, ip)) {
    return { success: false, message: 'Security check failed. Please try again.' }
  }
  const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.ok) return { success: false, message: 'Too many messages. Please try again later.' }

  const payload = await getPayload({ config: await config })
  const { name, email, subject, message } = parsed.data
  await payload.create({
    collection: 'contact-messages',
    overrideAccess: true,
    data: { name, email, subject, message },
  })

  try {
    await sendContactNotice(payload, { name, email, subject, message })
  } catch (error) {
    console.error('Could not send contact notification email', error)
  }
  return { success: true, message: 'Your message has been sent.' }
}
