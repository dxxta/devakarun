import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Category, Post } from '@/payload-types'
import { CategoryLinks } from '@/components/blog/category-links'
import { PostList } from '@/components/blog/post-list'
import { ErrorState } from '@/components/states/error-state'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Blog', description: 'Notes and articles.' }

export default async function BlogPage() {
  let posts: Post[] = []
  let categories: Category[] = []
  let failed = false
  try {
    const payload = await getPayload({ config })
    const [postResult, categoryResult] = await Promise.all([
      payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, sort: '-publishedAt', depth: 2, limit: 50 }),
      payload.find({ collection: 'categories', sort: 'name', limit: 100 }),
    ])
    posts = postResult.docs
    categories = categoryResult.docs
  } catch {
    failed = true
  }
  if (failed) return <ErrorState message="Refresh the page to try loading the blog again." title="The blog could not load" />
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="m-0 text-balance font-display text-4xl font-extrabold sm:text-5xl">Blog</h1>
        <p className="m-0 max-w-prose text-pretty text-muted-foreground">Articles and notes.</p>
      </header>
      <CategoryLinks categories={categories} />
      <PostList posts={posts} />
    </div>
  )
}
