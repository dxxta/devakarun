import { env } from './env'

const CLOUDFLARE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const DEVELOPMENT_TEST_SECRET = '1x0000000000000000000000000000000AA'

type TurnstileResponse = { success?: boolean }

export async function verifyTurnstile(token: string | null, ip?: string): Promise<boolean> {
  if (!token) return false

  const secret = env.TURNSTILE_SECRET_KEY ??
    (process.env.NODE_ENV === 'development' ? DEVELOPMENT_TEST_SECRET : undefined)
  if (!secret) return false

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  try {
    const response = await fetch(CLOUDFLARE_VERIFY_URL, {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      cache: 'no-store',
    })
    if (!response.ok) return false
    const result = await response.json() as TurnstileResponse
    return result.success === true
  } catch {
    return false
  }
}
