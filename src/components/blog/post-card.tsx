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
  const date = formatDate(post.publishedAt)

  return (
    <Card className="h-full overflow-hidden border-2 border-ink-fixed bg-card" data-pressable="card">
      <CardHeader className="gap-3 px-5 pb-0 pt-5">
        {post.categories?.length ? <div className="flex flex-wrap gap-2">{post.categories.map((item) => typeof item === 'object' && item ? <Badge key={item.id} variant="secondary">{item.name}</Badge> : null)}</div> : null}
        <CardTitle className="font-display text-2xl font-bold leading-tight"><Link className="link-underline focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" href={`/blog/${post.slug}`}>{post.title}</Link></CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5 px-5 pb-5 pt-3">
        <p className="m-0 text-pretty text-muted-foreground">{post.excerpt}</p>
        {date ? <time className="mt-auto block pt-1 text-sm text-muted-foreground" dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
      </CardContent>
    </Card>
  )
}
