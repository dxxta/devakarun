import Link from 'next/link'

export type PostSuggestion = {
  title: string
  slug: string
  publishedAt?: string | null
}

function formatDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

function SuggestionCard({ post, direction }: { post: PostSuggestion; direction: 'Previous' | 'Next' }) {
  const date = formatDate(post.publishedAt)
  return (
    <Link
      className="block min-w-0 rounded-card border-2 border-ink-fixed bg-card p-3 text-foreground shadow-hard focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      data-pressable="card"
      href={`/blog/${post.slug}`}
    >
      <span className="block text-xs font-semibold text-muted-foreground">{direction}</span>
      <span className="link-underline mt-1 block font-display font-bold leading-snug">{post.title}</span>
      {date ? <time className="mt-2 block text-xs text-muted-foreground" dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
    </Link>
  )
}

export function PostSuggestions({ previous, next, className = '' }: { previous: PostSuggestion | null; next: PostSuggestion | null; className?: string }) {
  if (!previous && !next) return null
  return (
    <nav aria-label="More blog posts" className={`space-y-3 ${className}`}>
      {previous ? <SuggestionCard direction="Previous" post={previous} /> : null}
      {next ? <SuggestionCard direction="Next" post={next} /> : null}
    </nav>
  )
}
