import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'
import { REST_POST } from '@payloadcms/next/routes'
import config from '@/payload.config'
import type { Post } from '@/payload-types'

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: vi.fn().mockResolvedValue(true) }))

import { addComment } from '@/components/comments/actions'

let payload: Payload
let postID: number
let commenterID: number
let pendingID: number
let approvedID: number
const slug = `comments-access-${Date.now()}`

function validContent(): Post['content'] {
  return {
    root: {
      type: 'root',
      version: 1,
      children: [{
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', text: 'Comment test post.', version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
        direction: null,
        format: '',
        indent: 0,
      }],
      direction: null,
      format: '',
      indent: 0,
    },
  }
}

describe('comments access', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const post = await payload.create({
      collection: 'posts',
      overrideAccess: true,
      data: { title: 'Comment access test', slug, excerpt: 'Test post', content: validContent(), _status: 'published' },
    })
    postID = post.id
    const commenter = await payload.create({
      collection: 'commenters',
      overrideAccess: true,
      data: { googleId: `comments-test-${Date.now()}`, name: 'Test Commenter', email: 'comments-test@example.invalid' },
    })
    commenterID = commenter.id
    const pending = await payload.create({
      collection: 'comments',
      overrideAccess: true,
      data: { post: postID, commenter: commenterID, authorName: 'Test Commenter', body: 'Pending comment', status: 'pending' },
    })
    pendingID = pending.id
    const approved = await payload.create({
      collection: 'comments',
      overrideAccess: true,
      data: { post: postID, commenter: commenterID, authorName: 'Test Commenter', body: 'Approved comment', status: 'approved' },
    })
    approvedID = approved.id
  })

  afterAll(async () => {
    if (!payload) return
    for (const id of [pendingID, approvedID]) {
      if (id) await payload.delete({ collection: 'comments', id, overrideAccess: true })
    }
    if (commenterID) await payload.delete({ collection: 'commenters', id: commenterID, overrideAccess: true })
    if (postID) await payload.delete({ collection: 'posts', id: postID, overrideAccess: true })
  })

  it('blocks anonymous REST-style comment creation', async () => {
    await expect(payload.create({
      collection: 'comments',
      overrideAccess: false,
      user: null,
      data: { post: postID, commenter: commenterID, authorName: 'Anonymous', body: 'Blocked comment', status: 'pending' },
    })).rejects.toMatchObject({ status: 403 })
  })

  it('hides pending comments from anonymous visitors and exposes approved comments', async () => {
    const pending = await payload.find({
      collection: 'comments',
      overrideAccess: false,
      user: null,
      where: { id: { equals: pendingID } },
    })
    const approved = await payload.find({
      collection: 'comments',
      overrideAccess: false,
      user: null,
      where: { id: { equals: approvedID } },
    })

    expect(pending.docs).toHaveLength(0)
    expect(approved.docs).toHaveLength(1)
  })

  it('does not accept an Auth.js session cookie as Payload REST authentication', async () => {
    const response = await REST_POST(config)(new Request('http://localhost/api/comments', {
      method: 'POST',
      headers: {
        cookie: 'authjs.session-token=visitor-session-only',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ post: postID, commenter: commenterID, body: 'Not a Payload user' }),
    }), { params: Promise.resolve({ slug: ['comments'] }) })

    expect(response.status).toBe(403)
  })

  it('rejects addComment when there is no Auth.js session', async () => {
    await expect(addComment(postID, null, 'A valid comment body', 'valid-turnstile-token')).rejects.toThrow('Sign in to comment.')
  })
})
