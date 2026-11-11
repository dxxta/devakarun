import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Post } from '@/payload-types'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'

let payload: Payload
const createdIDs: (string | number)[] = []
const suffix = `${Date.now()}`
const publishedSlug = `access-published-${suffix}`
const draftSlug = `access-draft-${suffix}`

function testContent(text: string): Post['content'] {
  return {
    root: {
      type: 'root',
      version: 1,
      children: [{
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', text, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
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

describe('blog access', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const published = await payload.create({
      collection: 'posts',
      overrideAccess: true,
      data: {
        title: 'Access test published post',
        slug: publishedSlug,
        excerpt: 'Published test content',
        content: testContent('Published test content.'),
        publishedAt: new Date().toISOString(),
        _status: 'published',
      },
    })
    createdIDs.push(published.id)

    const draft = await payload.create({
      collection: 'posts',
      overrideAccess: true,
      data: {
        title: 'Access test draft post',
        slug: draftSlug,
        excerpt: 'Draft test content',
        content: testContent('Draft test content.'),
        _status: 'draft',
      },
    })
    createdIDs.push(draft.id)
  })

  afterAll(async () => {
    if (payload) {
      for (const id of createdIDs) {
        await payload.delete({ collection: 'posts', id, overrideAccess: true })
      }
    }
  })

  it('lets anonymous visitors read published posts but hides drafts', async () => {
    const published = await payload.find({
      collection: 'posts',
      overrideAccess: false,
      user: null,
      where: { slug: { equals: publishedSlug } },
    })
    const draft = await payload.find({
      collection: 'posts',
      overrideAccess: false,
      user: null,
      where: { slug: { equals: draftSlug } },
    })

    expect(published.docs).toHaveLength(1)
    expect(draft.docs).toHaveLength(0)
  })

  it('denies anonymous post creation', async () => {
    await expect(payload.create({
      collection: 'posts',
      overrideAccess: false,
      user: null,
      data: {
        title: 'Anonymous post',
        slug: `anonymous-${suffix}`,
        excerpt: 'Should not save',
        content: testContent('Anonymous content.'),
      },
    })).rejects.toThrow()
  })

  it('denies anonymous post updates and deletes', async () => {
    const postID = createdIDs[0]
    await expect(payload.update({
      collection: 'posts',
      id: postID,
      overrideAccess: false,
      user: null,
      data: { title: 'Anonymous update' },
    })).rejects.toThrow()
    await expect(payload.delete({
      collection: 'posts',
      id: postID,
      overrideAccess: false,
      user: null,
    })).rejects.toThrow()
  })
})
