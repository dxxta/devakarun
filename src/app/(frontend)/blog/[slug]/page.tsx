import { Suspense } from 'react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { estimateReadingMinutes } from '@/lib/seo'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/states/error-state'
import { LoadingState } from '@/components/states/loading-state'
import { LivePreviewListener } from '@/components/blog/live-preview-listener'
import { CommentsSection } from '@/components/comments/comments-section'
import type { Post } from '@/payload-types'

export const dynamic = 'force-dynamic'

type PostPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

async function getPublishedPost(slug: string, preview = false): Promise<Post | null> {
  const payload = await getPayload({ config })
  if (preview) {
    // Drafts are only shown to a signed-in admin (the Live Preview iframe shares the admin session).
    const { user } = await payload.auth({ headers: await headers() })
    if (user) {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        draft: true,
        depth: 2,
        limit: 1,
        overrideAccess: false,
        user,
      })
      return docs[0] ?? null
    }
  }
  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    depth: 2,
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPost(slug)
  if (!post) return { title: 'Post not found' }
  return {
    title: post.meta?.title || post.title,
    description: post.meta?.description || post.excerpt,
    openGraph: { title: post.meta?.title || post.title, description: post.meta?.description || post.excerpt },
  }
}

export default async function BlogPostPage({ params, searchParams }: PostPageProps) {
  const { slug } = await params
  const preview = (await searchParams).preview === 'true'
  let post: Post | null
  try {
    post = await getPublishedPost(slug, preview)
  } catch {
    return <ErrorState message="Refresh the page to try loading this post again." title="This post could not load" />
  }
  if (!post) notFound()

  const cover = typeof post.coverImage === 'object' ? post.coverImage : null
  const date = post.publishedAt ? new Date(post.publishedAt) : null

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      {preview ? <LivePreviewListener /> : null}
      <header className="space-y-5">
        {post.categories?.length ? <div className="flex flex-wrap gap-2">{post.categories.map((item) => typeof item === 'object' && item ? <Badge key={item.id} variant="secondary">{item.name}</Badge> : null)}</div> : null}
        <h1 className="m-0 text-balance font-display text-4xl font-extrabold sm:text-5xl">{post.title}</h1>
        <p className="m-0 text-pretty text-lg text-muted-foreground">{post.excerpt}</p>
        <p className="m-0 text-sm text-muted-foreground">
          {date && !Number.isNaN(date.getTime()) ? <time dateTime={post.publishedAt ?? undefined}>{new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(date)}</time> : null}
          {' · '}{estimateReadingMinutes(post.content)} min read
        </p>
      </header>
      {cover?.url ? <div className="relative aspect-[16/9] overflow-hidden rounded-card border-2 border-border"><Image alt={cover.alt || ''} className="object-cover" fill priority sizes="(max-width: 768px) 100vw, 768px" src={cover.url} /></div> : null}
      <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-a:text-foreground prose-a:underline prose-a:underline-offset-4">
        <RichText data={post.content} />
      </div>
      <Suspense fallback={<LoadingState label="Loading comments…" variant="list" />}>
        <CommentsSection postId={post.id} />
      </Suspense>
    </article>
  )
}
