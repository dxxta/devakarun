import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Category, Post } from '@/payload-types'
import { CategoryLinks } from '@/components/blog/category-links'
import { PostList } from '@/components/blog/post-list'
import { ErrorState } from '@/components/states/error-state'

export const dynamic = 'force-dynamic'

type CategoryPageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })
  const category = docs[0]
  return category ? { title: `${category.name} | Blog`, description: `Posts in ${category.name}.` } : { title: 'Category not found' }
}

export default async function BlogCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  let categories: Category[]
  let category: Category | undefined
  let posts: Post[]

  try {
    const payload = await getPayload({ config })
    const [categoryResult, matchedResult] = await Promise.all([
      payload.find({ collection: 'categories', sort: 'name', limit: 100 }),
      payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 }),
    ])
    categories = categoryResult.docs
    category = matchedResult.docs[0]
    if (category) {
      const postResult = await payload.find({
        collection: 'posts',
        where: { and: [{ _status: { equals: 'published' } }, { categories: { in: [category.id] } }] },
        sort: '-publishedAt',
        depth: 2,
        limit: 50,
      })
      posts = postResult.docs
    } else {
      posts = []
    }
  } catch {
    return <ErrorState message="Refresh the page to try loading this category again." title="This category could not load" />
  }

  if (!category) notFound()
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="m-0 text-balance font-display text-4xl font-extrabold sm:text-5xl">{category.name}</h1>
        <p className="m-0 text-pretty text-muted-foreground">Posts in this category.</p>
      </header>
      <CategoryLinks categories={categories} selectedSlug={category.slug} />
      <PostList emptyHint="There are no published posts in this category yet." posts={posts} />
    </div>
  )
}
