import type { Post } from '@/payload-types'

export function getSiteURL(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export function absoluteURL(path: string): string {
  return new URL(path, getSiteURL()).toString()
}

export function estimateReadingMinutes(content: Post['content']): number {
  const text = extractText(content)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 220))
}

export function extractText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(extractText).join(' ')
  if (typeof value !== 'object' || value === null) return ''

  const record = value as Record<string, unknown>
  const ownText = typeof record.text === 'string' ? record.text : ''
  const childText = extractText(record.children)
  return [ownText, childText].filter(Boolean).join(' ')
}
