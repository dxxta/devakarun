import type { Metadata } from 'next'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@payload-config'
import type { Category, Post } from '@/payload-types'
import { CategoryLinks } from '@/components/blog/category-links'
import { Pagination } from '@/components/blog/pagination'
import { PostList } from '@/components/blog/post-list'
import { ErrorState } from '@/components/states/error-state'
import { absoluteURL } from '@/lib/seo'

const PAGE_SIZE = 6
const BLOG_PATH = '/blog'
type SearchParams = Record<string, string | string[] | undefined>

function parsePage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : null
}

function pageURL(page: number, searchParams: SearchParams = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page' || value === undefined) continue
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item))
    else query.set(key, value)
  }
  if (page > 1) query.set('page', String(page))
  const search = query.toString()
  return search ? `${BLOG_PATH}?${search}` : BLOG_PATH
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const params = await searchParams
  const requestedPage = parsePage(params.page) ?? 1

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: PAGE_SIZE,
      page: 1,
    })
    const page = Math.min(requestedPage, Math.max(1, result.totalPages))

    return {
      title: page > 1 ? `Blog, page ${page}` : 'Blog',
      description: 'Notes and articles.',
      alternates: { canonical: absoluteURL(pageURL(page)) },
      pagination: {
        previous: page > 1 ? absoluteURL(pageURL(page - 1)) : undefined,
        next: page < result.totalPages ? absoluteURL(pageURL(page + 1)) : undefined,
      },
    }
  } catch {
    return { title: 'Blog', description: 'Notes and articles.', alternates: { canonical: absoluteURL(BLOG_PATH) } }
  }
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const requestedPage = parsePage(params.page)
  if (requestedPage === null) redirect(pageURL(1, params))

  let posts: Post[] = []
  let categories: Category[] = []
  let page = requestedPage
  let totalPages = 1
  let redirectPage: number | null = null
  let failed = false

  try {
    const payload = await getPayload({ config })
    const [postResult, categoryResult] = await Promise.all([
      payload.find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 1,
        limit: PAGE_SIZE,
        page: requestedPage,
      }),
      payload.find({ collection: 'categories', sort: 'name', limit: 100 }),
    ])

    totalPages = Math.max(1, postResult.totalPages)
    if (requestedPage > totalPages) {
      redirectPage = totalPages
    } else {
      page = postResult.page ?? requestedPage
      posts = postResult.docs
    }
    categories = categoryResult.docs
  } catch {
    failed = true
  }

  if (failed) return <ErrorState message="Refresh the page to try loading the blog again." title="The blog could not load" />
  if (redirectPage !== null) redirect(pageURL(redirectPage, params))
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="m-0 text-balance font-display text-4xl font-extrabold sm:text-5xl">Blog</h1>
        <p className="m-0 max-w-prose text-pretty text-muted-foreground">Articles and notes.</p>
      </header>
      <CategoryLinks categories={categories} />
      <PostList posts={posts} />
      <Pagination basePath={BLOG_PATH} label="Blog pages" page={page} searchParams={params} totalPages={totalPages} />
    </div>
  )
}
