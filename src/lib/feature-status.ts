import type { Payload } from 'payload'

type FeatureStatus = { name: string; enabled: boolean; detail: string }

const isSet = (value: string | undefined): boolean => Boolean(value?.trim())
const isFalse = (value: string | undefined): boolean => value?.trim().toLowerCase() === 'false'
const isTrue = (value: string | undefined): boolean => value?.trim().toLowerCase() === 'true'

// Reports which optional features are switched on. Only on/off is logged, never a value or secret.
export function getFeatureStatuses(input: Record<string, string | undefined>): FeatureStatus[] {
  return [
    { name: 'SMTP email', enabled: isSet(input.SMTP_HOST), detail: 'SMTP_HOST' },
    { name: 'Contact notifications', enabled: isSet(input.CONTACT_TO), detail: 'CONTACT_TO' },
    { name: 'Turnstile captcha', enabled: isSet(input.TURNSTILE_SITE_KEY) && isSet(input.TURNSTILE_SECRET_KEY), detail: 'TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY' },
    { name: 'Google sign-in', enabled: isSet(input.AUTH_SECRET) && isSet(input.AUTH_GOOGLE_ID) && isSet(input.AUTH_GOOGLE_SECRET), detail: 'AUTH_SECRET + AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET' },
    { name: 'GitHub sync', enabled: isSet(input.GITHUB_TOKEN) && !isTrue(input.SKIP_GITHUB_SYNC), detail: 'GITHUB_TOKEN, SKIP_GITHUB_SYNC not true' },
    { name: 'Scheduled sync (cron)', enabled: isSet(input.CRON_SECRET), detail: 'CRON_SECRET' },
    { name: 'Content seeding', enabled: !isFalse(input.SEED_CONTENT), detail: 'SEED_CONTENT not false' },
    { name: 'AI crawler blocking', enabled: !isFalse(input.BLOCK_AI_CRAWLERS), detail: 'BLOCK_AI_CRAWLERS not false' },
    { name: 'Cloudflare images', enabled: isTrue(input.CLOUDFLARE_IMAGES), detail: 'CLOUDFLARE_IMAGES=true' },
  ]
}

export function logFeatureStatus(payload: Pick<Payload, 'logger'>, input: Record<string, string | undefined> = process.env): void {
  const statuses = getFeatureStatuses(input)
  const lines = statuses.map(({ name, enabled, detail }) => `  ${enabled ? 'ON ' : 'OFF'}  ${name} (${detail})`)
  payload.logger.info(`Feature status:\n${lines.join('\n')}`)
}
