import type { Post } from '@/payload-types'
import { EmptyState } from '@/components/states/empty-state'
import { PostCard } from './post-card'

export function PostList({ posts, emptyHint = 'Check back soon for new writing.' }: { posts: Post[]; emptyHint?: string }) {
  if (!posts.length) return <EmptyState hint={emptyHint} title="No posts yet" />
  return <div className="grid gap-6 md:grid-cols-2">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
}
