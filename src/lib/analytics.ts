export const clickEventNames = [
  'hero_github',
  'hero_about',
  'marquee_contact',
  'marquee_cookies',
  'contact_link',
  'social_click',
  'project_open',
  'project_github',
  'project_live',
  'cv_download',
  'outbound_link',
  'code_copy',
  'share_copy',
  'share_native',
  'share_x',
  'share_linkedin',
  'share_facebook',
  'share_whatsapp',
  'share_telegram',
  'share_email',
] as const

const botUserAgent = /bot|crawler|spider|crawl|slurp|headless|preview|facebookexternalhit|curl|wget|python|node-fetch/i

export function isBotUserAgent(userAgent: string): boolean {
  return botUserAgent.test(userAgent)
}

export function countryFromHeaders(headers: Headers): string {
  const country = headers.get('cf-ipcountry')?.trim().toUpperCase()
  return country && /^[A-Z]{2}$/.test(country) ? country : 'XX'
}

export function normalizeAnalyticsPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 250) return null
  if (!value.startsWith('/') || value.startsWith('//') || /[?#\\]/.test(value)) return null
  if (value === '/console' || value.startsWith('/console/') || value === '/api' || value.startsWith('/api/')) return null
  return value
}

export function analyticsLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const label = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120)
  return label || undefined
}
