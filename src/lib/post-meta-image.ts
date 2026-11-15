import { getPayload } from 'payload'
import config from '@payload-config'
import type { Media, Post } from '@/payload-types'

export type PostMetaImage = { url: string; width?: number; height?: number; alt: string }
type LexicalNode = { type?: unknown; value?: unknown; fields?: unknown; children?: unknown }

function populatedMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'url' in value && typeof value.url === 'string' && value.url.length > 0
}

async function mediaForValue(value: unknown): Promise<Media | null> {
  if (populatedMedia(value)) return value
  const id = typeof value === 'number'
    ? value
    : typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number'
      ? value.id
      : null
  if (id === null) return null
  try {
    const payload = await getPayload({ config })
    const media = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    return populatedMedia(media) ? media : null
  } catch {
    return null
  }
}

function absoluteImage(media: Media, siteURL: string, alt?: string): PostMetaImage | null {
  if (!media.url) return null
  try {
    return {
      url: new URL(media.url, siteURL).toString(),
      ...(media.width ? { width: media.width } : {}),
      ...(media.height ? { height: media.height } : {}),
      alt: alt?.trim() || media.alt || 'Post image',
    }
  } catch {
    return null
  }
}

async function firstUpload(value: unknown, siteURL: string): Promise<PostMetaImage | null> {
  if (Array.isArray(value)) {
    for (const child of value) {
      const result = await firstUpload(child, siteURL)
      if (result) return result
    }
    return null
  }
  if (typeof value !== 'object' || value === null) return null

  const node = value as LexicalNode
  if (node.type === 'upload') {
    const media = await mediaForValue(node.value)
    if (media) {
      const fields = typeof node.fields === 'object' && node.fields !== null ? node.fields as Record<string, unknown> : {}
      const dashboardScreenshot = media.filename?.startsWith('cloudflare-transformations-')
      if (!dashboardScreenshot) {
        const image = absoluteImage(media, siteURL, typeof fields.alt === 'string' ? fields.alt : undefined)
        if (image) return image
      }
    }
  }
  return firstUpload(node.children, siteURL)
}

export async function resolvePostMetaImage(post: Post, siteURL: string): Promise<PostMetaImage> {
  const cover = await mediaForValue(post.coverImage)
  if (cover) {
    const image = absoluteImage(cover, siteURL)
    if (image) return image
  }

  const contentRoot = typeof post.content === 'object' && post.content !== null && 'root' in post.content
    ? post.content.root
    : post.content
  const bodyImage = await firstUpload(contentRoot, siteURL)
  if (bodyImage) return bodyImage

  return {
    url: new URL('/icon-512.png', siteURL).toString(),
    width: 512,
    height: 512,
    alt: `${post.title} site icon`,
  }
}
