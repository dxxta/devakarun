import { getPayload } from 'payload'
import type { Post } from '@/payload-types'
import config from '@payload-config'

type LexicalRecord = Record<string, unknown> & { type?: string; children?: unknown }
type CodeContent = Post['content']

const languages = new Set(['ts', 'tsx', 'js', 'jsx', 'json', 'bash', 'css', 'html', 'sql', 'yaml', 'diff', 'markdown', 'http', 'dockerfile', 'plaintext'])

function textFromNode(value: unknown): string {
  if (Array.isArray(value)) return value.map(textFromNode).join('')
  if (typeof value !== 'object' || value === null) return ''
  const node = value as LexicalRecord
  if (node.type === 'text') return typeof node.text === 'string' ? node.text : ''
  return textFromNode(node.children)
}

function convertContent(content: unknown, postID: number): { content: CodeContent; convertedNodes: number } {
  let convertedNodes = 0
  let nodeIndex = 0

  function visit(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(visit)
    if (typeof value !== 'object' || value === null) return value

    const node = value as LexicalRecord
    if (node.type === 'code') {
      convertedNodes += 1
      const sourceLanguage = typeof node.language === 'string' ? node.language.trim().toLowerCase() : ''
      const language = languages.has(sourceLanguage) ? sourceLanguage : 'plaintext'
      const code = typeof node.code === 'string' ? node.code : textFromNode(node.children)
      return {
        type: 'block',
        version: 2,
        format: '',
        fields: {
          id: `converted-${postID}-${nodeIndex++}`,
          blockName: 'Code block',
          blockType: 'code',
          language,
          code,
        },
      }
    }

    return {
      ...node,
      ...(node.children === undefined ? {} : { children: visit(node.children) }),
    }
  }

  const state = typeof content === 'object' && content !== null && 'root' in content
    ? { ...(content as Record<string, unknown>), root: visit((content as Record<string, unknown>).root) }
    : visit(content)
  return { content: state as CodeContent, convertedNodes }
}

async function convertLegacyCodeNodes(): Promise<void> {
  const payload = await getPayload({ config })
  let convertedPosts = 0
  let convertedNodes = 0

  try {
    const [published, latest] = await Promise.all([
      payload.find({ collection: 'posts', depth: 0, draft: false, limit: 1000, pagination: false, overrideAccess: true }),
      payload.find({ collection: 'posts', depth: 0, draft: true, limit: 1000, pagination: false, overrideAccess: true }),
    ])

    const versions = new Map<string, Post>()
    for (const post of published.docs) versions.set(`${post.id}:published`, post)
    for (const post of latest.docs) {
      const status = post._status === 'draft' ? 'draft' : 'published'
      versions.set(`${post.id}:${status}`, post)
    }

    for (const post of versions.values()) {
      const converted = convertContent(post.content, post.id)
      if (converted.convertedNodes === 0) continue

      const status = post._status === 'draft' ? 'draft' : 'published'
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: converted.content,
          ...(post._status ? { _status: post._status } : {}),
        },
        draft: status === 'draft',
        depth: 0,
        overrideAccess: true,
      })
      convertedPosts += 1
      convertedNodes += converted.convertedNodes
    }

    payload.logger.info(`Converted ${convertedNodes} legacy code nodes across ${convertedPosts} post versions.`)
  } finally {
    await payload.destroy()
  }
}

await convertLegacyCodeNodes()
