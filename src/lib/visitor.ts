import { createHash, randomBytes } from 'node:crypto'
import { getClientIP } from './client-ip'

const oneYear = 60 * 60 * 24 * 365

export type VisitorIdentity = {
  visitorHash: string
  ipHash: string
  day: string
  setCookie?: string
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function hashIP(ip: string, day = new Date().toISOString().slice(0, 10)): string {
  const salt = process.env.PAYLOAD_SECRET
  if (!salt) throw new Error('PAYLOAD_SECRET must be configured to create IP hashes.')
  return sha256(`${salt}:ip:${ip}:${day}`)
}

function readCookie(request: Request, name: string): string | undefined {
  const cookies = request.headers.get('cookie')
  if (!cookies) return undefined
  for (const part of cookies.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return value.join('=')
  }
  return undefined
}

export function getVisitor(request: Request): VisitorIdentity {
  const salt = process.env.PAYLOAD_SECRET
  if (!salt) throw new Error('PAYLOAD_SECRET must be configured to create visitor hashes.')

  const savedID = readCookie(request, 'vid')
  const visitorID = savedID && /^[a-f0-9]{32}$/i.test(savedID) ? savedID : randomBytes(16).toString('hex')
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const ip = getClientIP(request.headers)

  return {
    visitorHash: sha256(`${salt}:visitor:${visitorID}`),
    ipHash: hashIP(ip, day),
    day,
    ...(!savedID || !/^[a-f0-9]{32}$/i.test(savedID) ? {
      setCookie: `vid=${visitorID}; Max-Age=${oneYear}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    } : {}),
  }
}

function expectedOrigins(request: Request): string[] {
  const origins = new Set<string>([new URL(request.url).origin])
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(',')[0].trim()
  const proto = (request.headers.get('x-forwarded-proto') ?? '').split(',')[0].trim() || new URL(request.url).protocol.replace(':', '')
  if (host) origins.add(`${proto}://${host}`)
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) origins.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin)
  } catch {}
  return [...origins]
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin')
  const fetchSite = request.headers.get('sec-fetch-site')?.toLowerCase()
  if (fetchSite && fetchSite !== 'same-origin') return false
  if (origin) {
    try {
      return expectedOrigins(request).includes(new URL(origin).origin)
    } catch {
      return false
    }
  }
  return fetchSite === 'same-origin'
}

export function noStoreJSON(
  data: unknown,
  status = 200,
  setCookie?: string,
): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  if (setCookie) headers.set('Set-Cookie', setCookie)
  return Response.json(data, { status, headers })
}
