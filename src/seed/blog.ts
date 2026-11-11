import type { Payload } from 'payload'
import type { Post } from '@/payload-types'

type BlogSeedPost = {
  title: string
  slug: string
  excerpt: string
  paragraphs: string[]
  categories: string[]
  tags: string[]
  published: boolean
  publishedAt?: string
}

const categories = [
  { name: 'Engineering', slug: 'engineering' },
  { name: 'Notes', slug: 'notes' },
]

const tags = [
  { name: 'Next.js', slug: 'nextjs' },
  { name: 'Payload', slug: 'payload' },
  { name: 'Process', slug: 'process' },
]

const posts: BlogSeedPost[] = [
  {
    title: 'Building a steady writing habit',
    slug: 'building-a-steady-writing-habit',
    excerpt: 'A practical way to make room for clear, useful writing.',
    paragraphs: ['Start with a small promise that fits an ordinary week.', 'Keep notes as you work, then shape one idea at a time into a useful post.'],
    categories: ['notes'],
    tags: ['process'],
    published: true,
    publishedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    title: 'A simple content model for a blog',
    slug: 'a-simple-content-model-for-a-blog',
    excerpt: 'Keep editorial fields clear and make public content easy to query.',
    paragraphs: ['A small model is easier to maintain and easier to edit.', 'Keep drafts private, publish deliberately, and make each post easy to find.'],
    categories: ['engineering'],
    tags: ['payload'],
    published: true,
    publishedAt: '2026-02-10T09:00:00.000Z',
  },
  {
    title: 'Designing a fast page with server components',
    slug: 'designing-a-fast-page-with-server-components',
    excerpt: 'Render content close to the data and keep client code focused.',
    paragraphs: ['Server components are a good fit for pages that read published content.', 'Keep interactive behavior at the edges and send only the data the browser needs.'],
    categories: ['engineering'],
    tags: ['nextjs'],
    published: true,
    publishedAt: '2026-03-05T09:00:00.000Z',
  },
  {
    title: 'A draft about search quality',
    slug: 'a-draft-about-search-quality',
    excerpt: 'An unpublished note for testing draft access.',
    paragraphs: ['This draft stays private until it is ready to publish.'],
    categories: ['notes'],
    tags: ['process'],
    published: false,
  },
]

function lexicalContent(paragraphs: string[]): Post['content'] {
  return {
    root: {
      type: 'root',
      version: 1,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', text, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }],
        direction: null,
        format: '',
        indent: 0,
      })),
      direction: null,
      format: '',
      indent: 0,
    },
  }
}

async function upsertSearchEntry(payload: Payload, relationTo: 'posts' | 'projects', id: number, title: string): Promise<void> {
  const existing = await payload.find({
    collection: 'search',
    where: {
      and: [
        { 'doc.relationTo': { equals: relationTo } },
        { 'doc.value': { equals: id } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  const doc = existing.docs[0]
  const relation = relationTo === 'posts' ? { relationTo: 'posts' as const, value: id } : { relationTo: 'projects' as const, value: id }
  const data = { title, doc: relation, priority: 0 }

  if (doc) {
    await payload.update({ collection: 'search', id: doc.id, data, overrideAccess: true })
  } else {
    await payload.create({ collection: 'search', data, overrideAccess: true })
  }
}

async function deleteSearchEntry(payload: Payload, relationTo: 'posts' | 'projects', id: number): Promise<void> {
  await payload.delete({
    collection: 'search',
    where: {
      and: [
        { 'doc.relationTo': { equals: relationTo } },
        { 'doc.value': { equals: id } },
      ],
    },
    overrideAccess: true,
  })
}

export async function seedBlog(payload: Payload): Promise<void> {
  const categoryIDs = new Map<string, number>()
  const tagIDs = new Map<string, number>()

  for (const category of categories) {
    const existing = await payload.find({ collection: 'categories', where: { slug: { equals: category.slug } }, limit: 1, overrideAccess: true })
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'categories', id: existing.docs[0].id, data: category, overrideAccess: true })
      : await payload.create({ collection: 'categories', data: category, overrideAccess: true })
    categoryIDs.set(category.slug, doc.id)
  }

  for (const tag of tags) {
    const existing = await payload.find({ collection: 'tags', where: { slug: { equals: tag.slug } }, limit: 1, overrideAccess: true })
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'tags', id: existing.docs[0].id, data: tag, overrideAccess: true })
      : await payload.create({ collection: 'tags', data: tag, overrideAccess: true })
    tagIDs.set(tag.slug, doc.id)
  }

  for (const post of posts) {
    const existing = await payload.find({ collection: 'posts', where: { slug: { equals: post.slug } }, limit: 1, overrideAccess: true })
    const data = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: lexicalContent(post.paragraphs),
      categories: post.categories.map((slug) => categoryIDs.get(slug)).filter((id): id is number => id !== undefined),
      tags: post.tags.map((slug) => tagIDs.get(slug)).filter((id): id is number => id !== undefined),
      publishedAt: post.publishedAt,
      _status: post.published ? 'published' as const : 'draft' as const,
    }
    const doc = existing.docs[0]
      ? await payload.update({ collection: 'posts', id: existing.docs[0].id, data, overrideAccess: true })
      : await payload.create({ collection: 'posts', data, overrideAccess: true })

    if (post.published) {
      await upsertSearchEntry(payload, 'posts', doc.id, doc.title)
    } else {
      await deleteSearchEntry(payload, 'posts', doc.id)
    }
  }

  const { docs: projects } = await payload.find({ collection: 'projects', limit: 1000, pagination: false, overrideAccess: true })
  for (const project of projects) {
    await upsertSearchEntry(payload, 'projects', project.id, project.title)
  }
}
