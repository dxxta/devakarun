import { getPayload } from 'payload'
import config from '@payload-config'
import { getSiteURL } from '@/lib/seo'
import { resolvePostMetaImage } from '@/lib/post-meta-image'
import type { Media, Post } from '@/payload-types'

type LexicalNode = Record<string, unknown> & { type?: string; children?: LexicalNode[] }

function escapeHTML(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function plainText(node: LexicalNode): string {
  if (node.type === 'text') return typeof node.text === 'string' ? node.text : ''
  if (node.type === 'block') {
    const fields = typeof node.fields === 'object' && node.fields !== null ? node.fields as Record<string, unknown> : {}
    if (fields.blockType === 'code' && typeof fields.code === 'string') return fields.code
  }
  return (node.children ?? []).map(plainText).join('')
}

function absoluteMediaURL(url: string, siteURL: string): string {
  return new URL(url, siteURL).toString()
}

function safeLink(url: string): string | null {
  if (url.startsWith('/') || url.startsWith('#')) return url
  try {
    const protocol = new URL(url).protocol
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(protocol) ? url : null
  } catch {
    return null
  }
}

function renderImage(media: Media, alt: string, siteURL: string): string {
  if (!media.url) return ''
  const width = Math.max(1, Math.floor(media.width ?? 1200))
  const height = Math.max(1, Math.floor(media.height ?? 800))
  return `<amp-img src="${escapeHTML(absoluteMediaURL(media.url, siteURL))}" width="${width}" height="${height}" layout="responsive" alt="${escapeHTML(alt || media.alt)}"></amp-img>`
}

function renderNode(node: LexicalNode, siteURL: string): string {
  const children = (node.children ?? []).map((child) => renderNode(child, siteURL)).join('')
  switch (node.type) {
    case 'text':
      return escapeHTML(node.text)
    case 'linebreak':
      return '<br>'
    case 'paragraph':
      return `<p>${children}</p>`
    case 'heading':
      if (node.tag === 'h2' || node.tag === 'h3') return `<${node.tag}>${children}</${node.tag}>`
      return children
    case 'list': {
      const tag = node.listType === 'number' || node.tag === 'ol' ? 'ol' : 'ul'
      return `<${tag}>${children}</${tag}>`
    }
    case 'listitem':
      return `<li>${children}</li>`
    case 'code':
      return `<pre><code>${escapeHTML(plainText(node))}</code></pre>`
    case 'block': {
      const fields = typeof node.fields === 'object' && node.fields !== null ? node.fields as Record<string, unknown> : {}
      if (fields.blockType !== 'code' || typeof fields.code !== 'string') return children
      const language = typeof fields.language === 'string' ? ` class="language-${escapeHTML(fields.language)}"` : ''
      return `<pre><code${language}>${escapeHTML(fields.code)}</code></pre>`
    }
    case 'link':
    case 'autolink': {
      const fields = node.fields && typeof node.fields === 'object' ? node.fields as Record<string, unknown> : {}
      const href = typeof node.url === 'string' ? node.url : typeof fields.url === 'string' ? fields.url : ''
      const safeURL = safeLink(href)
      return safeURL ? `<a href="${escapeHTML(safeURL)}">${children}</a>` : children
    }
    case 'upload': {
      const value = node.value
      if (typeof value !== 'object' || value === null || !('url' in value)) return ''
      const media = value as Media
      const fields = node.fields && typeof node.fields === 'object' ? node.fields as Record<string, unknown> : {}
      const image = renderImage(media, typeof fields.alt === 'string' ? fields.alt : '', siteURL)
      const caption = typeof fields.caption === 'string' ? `<p>${escapeHTML(fields.caption)}</p>` : ''
      return `${image}${caption}`
    }
    default:
      return children
  }
}

function formatDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(date)
}

function ampHTML(post: Post, siteURL: string, metaImage: string): string {
  const canonical = new URL(`/blog/${encodeURIComponent(post.slug)}`, siteURL).toString()
  const body = post.content.root.children.map((node) => renderNode(node as LexicalNode, siteURL)).join('\n')
  const date = formatDate(post.publishedAt)

  return `<!doctype html>
<html amp lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
<link rel="canonical" href="${escapeHTML(canonical)}">
<meta property="og:image" content="${escapeHTML(metaImage)}">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
<style amp-custom>body{margin:0;background:#f7efe7;color:#151513;font:18px/1.7 Arial,sans-serif}main{max-width:760px;margin:0 auto;padding:32px 20px}h1,h2,h3{line-height:1.2}h1{font-size:2.4rem}h2{margin-top:2.5rem}p{margin:1.2rem 0}a{color:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}amp-img{margin:1.5rem 0}pre{overflow-x:auto;border:2px solid #000;border-radius:1rem;background:#efe7dc;padding:1rem}code{font-family:monospace}li{margin:.5rem 0}.date{color:#5e5a53;font-size:.9rem}</style>
<title>${escapeHTML(post.title)}</title>
</head>
<body><main>
<h1>${escapeHTML(post.title)}</h1>
${date ? `<p class="date"><time datetime="${escapeHTML(post.publishedAt)}">${escapeHTML(date)}</time></p>` : ''}
<p>${escapeHTML(post.excerpt)}</p>
${body}
</main></body>
</html>`
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    depth: 2,
    limit: 1,
  })
  const post = docs[0]
  if (!post) return new Response('Not found', { status: 404 })

  const siteURL = process.env.NEXT_PUBLIC_SITE_URL ? getSiteURL() : new URL(request.url).origin
  const metaImage = await resolvePostMetaImage(post, siteURL)
  return new Response(ampHTML(post, siteURL, metaImage.url), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
