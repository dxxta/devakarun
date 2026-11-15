import { Suspense } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { absoluteURL, estimateReadingMinutes, getSiteURL } from '@/lib/seo'
import { resolvePostMetaImage } from '@/lib/post-meta-image'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/states/error-state'
import { LoadingState } from '@/components/states/loading-state'
import { LivePreviewListener } from '@/components/blog/live-preview-listener'
import { CodeBlock as ShikiCodeBlock } from '@/components/blog/code-block'
import { CommentsSection } from '@/components/comments/comments-section'
import { PreviewableImage } from '@/components/blog/previewable-image'
import { Reactions } from '@/components/blog/reactions'
import { ViewCounter } from '@/components/blog/view-counter'
import { PostSuggestions, type PostSuggestion } from '@/components/blog/post-suggestions'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { getBlogHeadings } from '@/components/blog/heading-utils'
import { countPostViews } from '@/lib/post-activity'
import { ShareButton } from '@/components/share-button'
import type { Media, Post } from '@/payload-types'

export const dynamic = 'force-dynamic'

type PostPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

type PostNavigation = { previous: PostSuggestion | null; next: PostSuggestion | null }

type PostLinkFields = { url?: string; target?: string; rel?: string; newTab?: boolean }

function resolvePostLink(fields: PostLinkFields | undefined, fallbackURL?: string) {
  const href = fields?.url ?? fallbackURL ?? ''
  if (!href || /^(javascript|data|vbscript):/i.test(href.trim())) return null
  const external = /^https?:\/\//i.test(href)
  let host: string | undefined
  if (external) {
    try {
      host = new URL(href).hostname
    } catch {
      return null
    }
  } else if (!/^(\/|#|\?|mailto:|tel:)/i.test(href)) {
    return null
  }
  return {
    href,
    external,
    host,
    rel: fields?.rel ?? (external ? 'noreferrer' : undefined),
    target: fields?.target ?? (fields?.newTab || external ? '_blank' : undefined),
  }
}

function blogRichTextConverters(headings: ReturnType<typeof getBlogHeadings>): JSXConvertersFunction {
  let headingIndex = 0
  return ({ defaultConverters }) => ({
    ...defaultConverters,
    paragraph: ({ node, nodesToJSX }) => <p className="my-0">{nodesToJSX({ nodes: node.children })}</p>,
    heading: ({ node, nodesToJSX }) => {
      const isTOCHeading = node.tag === 'h2' || node.tag === 'h3'
      const heading = isTOCHeading ? headings[headingIndex++] : undefined
      const Tag = node.tag === 'h1' || node.tag === 'h4' || node.tag === 'h5' || node.tag === 'h6'
        ? node.tag
        : node.tag === 'h3' ? 'h3' : 'h2'
      return (
        <Tag className={`${Tag === 'h2' ? 'mb-0 mt-10 text-2xl' : 'mb-0 mt-8 text-xl'} scroll-mt-52 lg:scroll-mt-[8.5rem] font-display font-bold`} id={heading?.id}>
          {nodesToJSX({ nodes: node.children })}
        </Tag>
      )
    },
    list: ({ node, nodesToJSX }) => {
      const Tag = node.tag === 'ol' ? 'ol' : 'ul'
      return <Tag className={`my-0 space-y-2 pl-6 ${Tag === 'ol' ? 'list-decimal' : 'list-disc'}`}>{nodesToJSX({ nodes: node.children })}</Tag>
    },
    listitem: ({ node, nodesToJSX }) => <li>{nodesToJSX({ nodes: node.children })}</li>,
    code: ({ node }) => {
      const codeNode = node as { children?: Array<{ text?: string }>; code?: string; language?: string }
      const code = codeNode.children?.map((child) => child.text ?? '').join('') ?? codeNode.code ?? ''
      return <ShikiCodeBlock code={code} language={codeNode.language} />
    },
    blocks: {
      ...defaultConverters.blocks,
      code: ({ node }: { node: { fields?: unknown } }) => {
        const fields = typeof node.fields === 'object' && node.fields !== null
          ? node.fields as { code?: unknown; language?: unknown }
          : undefined
        if (typeof fields?.code !== 'string') return null
        return <ShikiCodeBlock code={fields.code} language={typeof fields.language === 'string' ? fields.language : 'plaintext'} />
      },
    },
    upload: ({ node }) => {
      const uploadNode = node as { fields?: { alt?: string; caption?: string }; value?: number | Media | string }
      const media = typeof uploadNode.value === 'object' && uploadNode.value !== null ? uploadNode.value : null
      if (!media || !('url' in media)) return null
      return <PreviewableImage alt={uploadNode.fields?.alt ?? media.alt} caption={uploadNode.fields?.caption} imageClassName="object-contain" media={media} sizes="(max-width: 1024px) 100vw, 900px" />
    },
    link: ({ node, nodesToJSX }) => {
      const linkNode = node as unknown as { fields?: PostLinkFields; url?: string }
      const link = resolvePostLink(linkNode.fields, linkNode.url)
      if (!link) return <>{nodesToJSX({ nodes: node.children })}</>
      return (
        <a className="link-underline" data-track={link.external ? 'outbound_link' : undefined} data-track-label={link.host} href={link.href} rel={link.rel} target={link.target}>
          {nodesToJSX({ nodes: node.children })}
        </a>
      )
    },
    autolink: ({ node, nodesToJSX }) => {
      const linkNode = node as unknown as { fields?: PostLinkFields; url?: string }
      const link = resolvePostLink(linkNode.fields, linkNode.url)
      if (!link) return <>{nodesToJSX({ nodes: node.children })}</>
      return (
        <a className="link-underline" data-track={link.external ? 'outbound_link' : undefined} data-track-label={link.host} href={link.href} rel={link.rel} target={link.target}>
          {nodesToJSX({ nodes: node.children })}
        </a>
      )
    },
  })
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

async function getPostNavigation(slug: string): Promise<PostNavigation> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: 'publishedAt',
    depth: 0,
    limit: 1000,
  })
  const index = docs.findIndex((post) => post.slug === slug)
  if (index < 0) return { previous: null, next: null }
  const toSuggestion = (post?: Post): PostSuggestion | null => post ? ({ title: post.title, slug: post.slug, publishedAt: post.publishedAt }) : null
  return { previous: toSuggestion(docs[index - 1]), next: toSuggestion(docs[index + 1]) }
}

async function getInitialViewCount(postID: number): Promise<number> {
  try {
    const payload = await getPayload({ config })
    return await countPostViews(payload, postID)
  } catch {
    return 0
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPost(slug)
  if (!post) return { title: 'Post not found' }
  const title = post.meta?.title || post.title
  const description = post.meta?.description || post.excerpt
  const image = await resolvePostMetaImage(post, getSiteURL())
  const iconURL = absoluteURL('/icon-512.png')
  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      images: [image],
    },
    twitter: {
      card: image.url === iconURL ? 'summary' : 'summary_large_image',
      images: [image.url],
    },
    alternates: { types: { 'application/amphtml': absoluteURL(`/blog/${encodeURIComponent(post.slug)}/amp`) } },
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

  const [navigation] = await Promise.all([preview ? Promise.resolve({ previous: null, next: null }) : getPostNavigation(slug)])
  const initialViewCount = preview ? null : await getInitialViewCount(post.id)
  const headings = getBlogHeadings(post.content)
  const converters = blogRichTextConverters(headings)
  const date = post.publishedAt ? new Date(post.publishedAt) : null

  return (
    <>
      <div className="grid grid-cols-1 gap-8 pb-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
        <TableOfContents headings={headings} mode="mobile" />
        <aside className="hidden self-start lg:sticky lg:top-[8.5rem] lg:col-start-1 lg:row-start-1 lg:block lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto">
          <div className="-ml-1 space-y-6 pl-1 pr-2 pb-2 pt-1">
            <TableOfContents headings={headings} mode="desktop" />
            {!preview ? <PostSuggestions next={navigation.next} previous={navigation.previous} /> : null}
          </div>
        </aside>
        <article className="min-w-0 space-y-8 lg:col-start-2 lg:row-start-1">
          {preview ? <LivePreviewListener /> : null}
          <header className="border-b border-border pb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
              <div className="flex flex-wrap items-center gap-2">
                {post.categories?.map((item) => typeof item === 'object' && item ? <Badge key={item.id} variant="secondary">{item.name}</Badge> : null)}
              </div>
              {!preview ? <ShareButton className="ml-auto" kind="post" title={post.title} url={absoluteURL(`/blog/${encodeURIComponent(post.slug)}`)} /> : null}
            </div>
            <h1 className="mt-6 text-balance font-display text-4xl font-extrabold sm:text-5xl">{post.title}</h1>
            <p className="mt-5 text-pretty text-lg text-muted-foreground">{post.excerpt}</p>
            <p className="m-0 mt-4 text-sm text-muted-foreground">
              {date && !Number.isNaN(date.getTime()) ? <time dateTime={post.publishedAt ?? undefined}>{new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(date)}</time> : null}
                {' · '}{estimateReadingMinutes(post.content)} min read
                {initialViewCount === null ? null : <ViewCounter initialCount={initialViewCount} slug={post.slug} />}
              </p>
          </header>
          <RichText
            className="post-body prose prose-lg max-w-none space-y-6 dark:prose-invert prose-headings:font-display prose-a:text-foreground"
            converters={converters}
            data={post.content}
          />
          {!preview ? (
            <div className="grid justify-items-start gap-2 border-t border-border pt-6">
              <p className="m-0 font-display font-bold">Share this post</p>
              <ShareButton kind="post" title={post.title} url={absoluteURL(`/blog/${encodeURIComponent(post.slug)}`)} />
            </div>
          ) : null}
          {!preview ? <PostSuggestions className="lg:hidden" next={navigation.next} previous={navigation.previous} /> : null}
        </article>
      </div>
      {!preview ? <Reactions slug={post.slug} /> : null}
      <Suspense fallback={<LoadingState label="Loading comments…" variant="list" />}>
        <CommentsSection postId={post.id} />
      </Suspense>
    </>
  )
}
