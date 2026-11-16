// Behind the Cloudflare proxy the connecting peer is a Cloudflare edge address, and
// x-forwarded-for / x-real-ip often hold it too. Cloudflare puts the visitor address in
// CF-Connecting-IP, so when the site runs behind Cloudflare prefer that header.
// Without Cloudflare (local development, another host) the standard proxy headers are used
// and the Cloudflare headers are ignored, because anyone could forge them.
//
// Cloudflare mode is chosen by CLOUDFLARE_PROXY (true or false). When it is not set, the
// site is assumed to be behind Cloudflare if CLOUDFLARE_IMAGES=true or both Turnstile keys are set.
// Only trust Cloudflare headers when the origin accepts traffic from Cloudflare alone.
type HeaderReader = { get(name: string): string | null }

const IP_PATTERN = /^[0-9a-fA-F:.]{3,45}$/

function isSet(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

export function isBehindCloudflare(source: Record<string, string | undefined> = process.env): boolean {
  const explicit = source.CLOUDFLARE_PROXY?.trim().toLowerCase()
  if (explicit === 'true') return true
  if (explicit === 'false') return false
  return source.CLOUDFLARE_IMAGES?.trim().toLowerCase() === 'true'
    || (isSet(source.TURNSTILE_SITE_KEY) && isSet(source.TURNSTILE_SECRET_KEY))
}

export function getClientIP(headers: HeaderReader, source: Record<string, string | undefined> = process.env): string {
  const candidates = isBehindCloudflare(source)
    ? [headers.get('cf-connecting-ip'), headers.get('true-client-ip'), headers.get('x-real-ip'), headers.get('x-forwarded-for')?.split(',')[0]]
    : [headers.get('x-real-ip'), headers.get('x-forwarded-for')?.split(',')[0]]
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && IP_PATTERN.test(value)) return value
  }
  return 'unknown'
}
