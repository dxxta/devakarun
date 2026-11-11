import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

export function PostCard({ post }: { post: Post }) {
  const cover = typeof post.coverImage === 'object' ? post.coverImage : null
  const date = formatDate(post.publishedAt)

  return (
    <Card className="overflow-hidden border-2 border-border bg-card" data-pressable="card">
      {cover?.url ? (
        <Link aria-label={`Read ${post.title}`} className="relative block aspect-[16/9] overflow-hidden focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" href={`/blog/${post.slug}`}>
          <Image alt={cover.alt || ''} className="object-cover" fill sizes="(max-width: 768px) 100vw, 50vw" src={cover.url} />
        </Link>
      ) : null}
      <CardHeader className="gap-3 px-5 pb-0 pt-5">
        {post.categories?.length ? <div className="flex flex-wrap gap-2">{post.categories.map((item) => typeof item === 'object' && item ? <Badge key={item.id} variant="secondary">{item.name}</Badge> : null)}</div> : null}
        <CardTitle className="font-display text-2xl font-bold leading-tight"><Link className="underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" href={`/blog/${post.slug}`}>{post.title}</Link></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 pt-3">
        <p className="m-0 text-pretty text-muted-foreground">{post.excerpt}</p>
        {date ? <time className="block text-sm text-muted-foreground" dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
      </CardContent>
    </Card>
  )
}
