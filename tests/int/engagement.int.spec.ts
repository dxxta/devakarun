import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { submitContactMessage } from '@/app/(frontend)/contact/actions'
import {
  confirmSubscription,
  subscribe,
  unsubscribe,
} from '@/app/(frontend)/newsletter/actions'

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(async (token: string | null) => token === 'valid-turnstile-token'),
}))
vi.mock('@/lib/email', () => ({
  createPayloadEmailAdapter: vi.fn(() => undefined),
  sendContactNotice: vi.fn(async () => undefined),
  sendNewsletterConfirmation: vi.fn(async () => undefined),
}))

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  await payload?.destroy()
})

describe('contact form action', () => {
  it('stores a valid contact message', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const result = await submitContactMessage({
      name: 'Integration Visitor',
      email: `contact-${suffix}@example.com`,
      subject: 'Integration subject',
      message: 'Please get back to me.',
      turnstileToken: 'valid-turnstile-token',
      website: '',
    })

    expect(result.success).toBe(true)
    const saved = await payload.find({
      collection: 'contact-messages',
      overrideAccess: true,
      where: { email: { equals: `contact-${suffix}@example.com` } },
    })
    expect(saved.docs).toHaveLength(1)
    await payload.delete({ collection: 'contact-messages', id: saved.docs[0]!.id, overrideAccess: true })
  })

  it('rejects invalid emails, honeypot submissions, and failed Turnstile checks', async () => {
    const base = {
      name: 'Integration Visitor',
      email: 'visitor@example.com',
      subject: 'Integration subject',
      message: 'Please get back to me.',
      turnstileToken: 'valid-turnstile-token',
      website: '',
    }

    expect((await submitContactMessage({ ...base, email: 'invalid' })).success).toBe(false)
    expect((await submitContactMessage({ ...base, website: 'bot' })).success).toBe(false)
    expect((await submitContactMessage({ ...base, turnstileToken: 'invalid' })).success).toBe(false)
  })
})

describe('newsletter token flow', () => {
  it('subscribes, confirms, and unsubscribes using one-time tokens', async () => {
    const email = `subscriber-${Date.now()}@example.com`
    expect((await subscribe(email, 'valid-turnstile-token')).success).toBe(true)

    const pending = await payload.find({
      collection: 'subscribers',
      overrideAccess: true,
      where: { email: { equals: email } },
    })
    expect(pending.docs).toHaveLength(1)
    const row = pending.docs[0] as unknown as {
      id: number | string
      status: string
      confirmToken: string
      unsubscribeToken: string
    }
    expect(row.status).toBe('pending')
    expect((await confirmSubscription(row.confirmToken)).success).toBe(true)

    const confirmed = await payload.findByID({ collection: 'subscribers', id: row.id, overrideAccess: true })
    expect(confirmed.status).toBe('confirmed')
    expect((await unsubscribe(row.unsubscribeToken)).success).toBe(true)

    const unsubscribed = await payload.findByID({ collection: 'subscribers', id: row.id, overrideAccess: true })
    expect(unsubscribed.status).toBe('unsubscribed')
    await payload.delete({ collection: 'subscribers', id: row.id, overrideAccess: true })
  })
})

describe('engagement collection access', () => {
  it('denies anonymous REST reads of contact messages and subscribers', async () => {
    await expect(payload.find({ collection: 'contact-messages', overrideAccess: false, user: null })).rejects.toThrow()
    await expect(payload.find({ collection: 'subscribers', overrideAccess: false, user: null })).rejects.toThrow()
  })
})
