import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { Payload } from 'payload'
import type { Project } from '@/payload-types'

const PAGE_TIMEOUT_MS = 8_000
const MAX_HTML_BYTES = 512 * 1024
const MAX_PREVIEW_BYTES = 5 * 1024 * 1024
const REDIRECT_LIMIT = 5
const IMAGE_TYPES = new Map([
  ['image/png', { extension: 'png', mimeType: 'image/png' }],
  ['image/jpeg', { extension: 'jpg', mimeType: 'image/jpeg' }],
  ['image/webp', { extension: 'webp', mimeType: 'image/webp' }],
  ['image/gif', { extension: 'gif', mimeType: 'image/gif' }],
])

export type ImportedLivePreview = {
  mediaID: number
  imageURL: string
  obsoleteMediaID?: number
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b] = parts as [number, number, number, number]
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 198 && (b === 18 || b === 19))
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0] ?? ''
  if (normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd')
    || /^fe[89ab]/.test(normalized) || normalized.startsWith('ff')) return true
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice('::ffff:'.length)
    if (mapped.includes('.')) return isPrivateIPv4(mapped)
    const groups = mapped.split(':')
    if (groups.length === 2) {
      const high = Number.parseInt(groups[0]!, 16)
      const low = Number.parseInt(groups[1]!, 16)
      if (Number.isFinite(high) && Number.isFinite(low)) {
        return isPrivateIPv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`)
      }
    }
  }
  return false
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  return host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')
}

function isPrivateAddress(address: string): boolean {
  const family = isIP(address)
  return family === 4 ? isPrivateIPv4(address) : family === 6 ? isPrivateIPv6(address) : true
}

export async function validatePublicHttpUrl(input: string, base?: string | URL): Promise<URL> {
  const url = base ? new URL(input, base) : new URL(input)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Preview URL must use HTTP or HTTPS.')
  if (url.username || url.password) throw new Error('Preview URL cannot include credentials.')
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('Preview URL uses a disallowed port.')
  if (isBlockedHostname(url.hostname)) throw new Error('Preview URL uses a local hostname.')

  const literalFamily = isIP(url.hostname.replace(/^\[|\]$/g, ''))
  const addresses = literalFamily
    ? [{ address: url.hostname.replace(/^\[|\]$/g, '') }]
    : await lookup(url.hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Preview URL resolves to a private or reserved address.')
  }
  return url
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function attributesFromTag(tag: string): Map<string, string> {
  const attributes = new Map<string, string>()
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  for (const match of tag.matchAll(pattern)) {
    const name = match[1]?.toLowerCase()
    const value = match[2] ?? match[3] ?? match[4]
    if (name && value !== undefined) attributes.set(name, decodeHtmlEntities(value.trim()))
  }
  return attributes
}

export function extractPreviewImageUrl(html: string, pageURL: string): string | null {
  const page = new URL(pageURL)
  for (const match of html.matchAll(/<(meta|link)\b[^>]*>/gi)) {
    const tag = match[0]!
    const attributes = attributesFromTag(tag)
    const key = (attributes.get('property') ?? attributes.get('name') ?? '').toLowerCase()
    const rel = (attributes.get('rel') ?? '').toLowerCase().split(/\s+/)
    const content = attributes.get('content')
    const href = attributes.get('href')
    const isPreviewMeta = ['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(key)
    const candidate = isPreviewMeta ? content : rel.includes('image_src') ? href : undefined
    if (!candidate) continue
    try {
      const resolved = new URL(candidate, page)
      if (resolved.protocol === 'http:' || resolved.protocol === 'https:') return resolved.toString()
    } catch {
      continue
    }
  }
  return null
}

async function cancelResponse(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  } catch {
    // The body may already have been consumed or closed.
  }
}

async function fetchWithValidatedRedirects(url: URL, signal: AbortSignal): Promise<{ response: Response; finalURL: URL }> {
  let currentURL = url
  for (let redirect = 0; redirect <= REDIRECT_LIMIT; redirect += 1) {
    await validatePublicHttpUrl(currentURL.toString())
    const response = await fetch(currentURL, {
      cache: 'no-store',
      redirect: 'manual',
      signal,
      headers: { 'User-Agent': 'dev-akarun-preview' },
    })
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, finalURL: currentURL }
    const location = response.headers.get('location')
    await cancelResponse(response)
    if (!location || redirect === REDIRECT_LIMIT) throw new Error('Preview page exceeded the redirect limit.')
    currentURL = await validatePublicHttpUrl(location, currentURL)
  }
  throw new Error('Preview page exceeded the redirect limit.')
}

async function readTextUpTo(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (totalBytes < maxBytes) {
    const { done, value } = await reader.read()
    if (done || !value) break
    const remaining = maxBytes - totalBytes
    const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value
    chunks.push(chunk)
    totalBytes += chunk.byteLength
    if (chunk.byteLength < value.byteLength) break
  }
  await reader.cancel().catch(() => undefined)
  return new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))))
}

async function readBytesUpTo(response: Response, maxBytes: number): Promise<Buffer> {
  const declaredSize = Number(response.headers.get('content-length') ?? 0)
  if (declaredSize > maxBytes) throw new Error('Preview image exceeds the 5 MB limit.')
  if (!response.body) throw new Error('Preview image has no body.')
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let totalBytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > maxBytes) throw new Error('Preview image exceeds the 5 MB limit.')
      chunks.push(Buffer.from(value))
    }
  } finally {
    await reader.cancel().catch(() => undefined)
  }
  return Buffer.concat(chunks)
}

async function getWebsiteImageUrl(homepage: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS)
  try {
    const initialURL = await validatePublicHttpUrl(homepage)
    const { response, finalURL } = await fetchWithValidatedRedirects(initialURL, controller.signal)
    if (!response.ok) {
      await cancelResponse(response)
      throw new Error(`Live preview page returned ${response.status}.`)
    }
    const html = await readTextUpTo(response, MAX_HTML_BYTES)
    return extractPreviewImageUrl(html, finalURL.toString())
  } finally {
    clearTimeout(timeout)
  }
}

function extensionForMimeType(contentType: string | null): { extension: string; mimeType: string } {
  const normalized = contentType?.split(';')[0]?.trim().toLowerCase() ?? ''
  const imageType = IMAGE_TYPES.get(normalized)
  if (!imageType) throw new Error('Preview image must be PNG, JPEG, WebP, or GIF.')
  return imageType
}

async function importPreviewImage(
  payload: Payload,
  pageURL: string,
  title: string,
  slug: string,
  imageURL: string,
  existing: Project | undefined,
): Promise<ImportedLivePreview> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS)
  try {
    const safeImageURL = await validatePublicHttpUrl(imageURL, pageURL)
    const currentCover = existing?.coverImage && typeof existing.coverImage === 'object'
      ? existing.coverImage
      : undefined
    if (existing?.previewSource === 'live' && existing.previewImageUrl === safeImageURL.toString() && currentCover) {
      return { mediaID: currentCover.id, imageURL: safeImageURL.toString() }
    }
    const { response } = await fetchWithValidatedRedirects(safeImageURL, controller.signal)
    if (!response.ok) {
      await cancelResponse(response)
      throw new Error(`Live preview image returned ${response.status}.`)
    }
    const imageType = extensionForMimeType(response.headers.get('content-type'))
    const imageData = await readBytesUpTo(response, MAX_PREVIEW_BYTES)
    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'project'
    const filename = `live-preview-${safeSlug}.${imageType.extension}`
    const mediaResult = await payload.find({
      collection: 'media',
      overrideAccess: true,
      showHiddenFields: true,
      limit: 1,
      where: { filename: { equals: filename } },
    })
    const existingMedia = mediaResult.docs[0]
    const mediaData = { alt: `${title} website preview` }
    const uploaded = existingMedia
      ? await payload.update({
        collection: 'media',
        id: existingMedia.id,
        overrideAccess: true,
        data: mediaData,
        file: { data: imageData, mimetype: imageType.mimeType, name: filename, size: imageData.byteLength },
      })
      : await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: mediaData,
        file: { data: imageData, mimetype: imageType.mimeType, name: filename, size: imageData.byteLength },
      })
    const previousCover = existing?.coverImage && typeof existing.coverImage === 'object'
      ? existing.coverImage
      : undefined
    const obsoleteMediaID = previousCover
      && previousCover.id !== uploaded.id
      && previousCover.filename?.startsWith(`live-preview-${safeSlug}.`)
      ? previousCover.id
      : undefined
    return { mediaID: uploaded.id, imageURL: safeImageURL.toString(), obsoleteMediaID }
  } finally {
    clearTimeout(timeout)
  }
}

export async function getAndImportWebsitePreview(
  payload: Payload,
  homepage: string,
  title: string,
  slug: string,
  existing?: Project,
): Promise<ImportedLivePreview | null> {
  const imageURL = await getWebsiteImageUrl(homepage)
  if (!imageURL) return null
  return importPreviewImage(payload, homepage, title, slug, imageURL, existing)
}

export function isPrivatePreviewAddress(address: string): boolean {
  return isPrivateAddress(address)
}
