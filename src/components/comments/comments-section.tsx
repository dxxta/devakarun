import { getPayload } from 'payload'
import { auth, googleSignInEnabled } from '@/auth'
import { ErrorState } from '@/components/states/error-state'
import { CommentForm } from '@/components/comments/comment-form'
import { GoogleSignInButton, SignOutButton } from '@/components/comments/auth-buttons'
import config from '@payload-config'
import type { Comment } from '@/payload-types'

function relationID(value: number | { id: number } | null | undefined): number | null {
  if (typeof value === 'number') return value
  return value?.id ?? null
}

function formatCommentDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
}

export async function CommentsSection({ postId }: { postId: number }) {
  let comments: Comment[] = []
  let failed = false
  try {
    const payload = await getPayload({ config })
    const results = await payload.find({
      collection: 'comments',
      where: { and: [{ post: { equals: postId } }, { status: { equals: 'approved' } }] },
      sort: 'createdAt',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      user: null,
    })
    comments = results.docs
  } catch {
    failed = true
  }
  const session = await auth()
  const siteKey = process.env.TURNSTILE_SITE_KEY || (process.env.NODE_ENV === 'development' ? '1x00000000000000000000AA' : '')
  if (failed) return <section aria-labelledby="comments-title" className="space-y-6"><h2 className="m-0 font-display text-2xl font-bold" id="comments-title">Comments</h2><ErrorState message="Refresh this page to load comments again." title="Comments could not load" /></section>

  const topLevel = comments.filter((comment) => relationID(comment.parent) === null)
  const repliesFor = (commentId: number) => comments.filter((comment) => relationID(comment.parent) === commentId)

  return (
    <section aria-labelledby="comments-title" className="space-y-7 border-t border-border pt-8">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="m-0 font-display text-2xl font-bold" id="comments-title">Comments</h2>
          <p className="m-0 text-sm text-muted-foreground">{comments.length} approved {comments.length === 1 ? 'comment' : 'comments'}</p>
        </div>
        {session?.user ? <SignOutButton /> : null}
      </header>

      {topLevel.length ? (
        <ol className="m-0 grid list-none gap-5 p-0">
          {topLevel.map((comment) => (
            <li className="grid gap-4" key={comment.id}>
              <article className="rounded-card border-2 border-border bg-card p-5">
                <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="m-0 font-display text-lg font-bold">{comment.authorName}</h3>
                  <time className="text-sm text-muted-foreground" dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
                </header>
                <p className="m-0 whitespace-pre-wrap text-pretty">{comment.body}</p>
              </article>
              {repliesFor(comment.id).length ? (
                <ol className="ml-4 grid list-none gap-3 border-l-2 border-border pl-4 sm:ml-8 sm:pl-6">
                  {repliesFor(comment.id).map((reply) => (
                    <li key={reply.id}>
                      <article className="rounded-card border-2 border-border bg-card p-4">
                        <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h4 className="m-0 font-display font-bold">{reply.authorName}</h4>
                          <time className="text-sm text-muted-foreground" dateTime={reply.createdAt}>{formatCommentDate(reply.createdAt)}</time>
                        </header>
                        <p className="m-0 whitespace-pre-wrap text-pretty">{reply.body}</p>
                      </article>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      <div className="space-y-4 rounded-card border-2 border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="m-0 font-display text-xl font-bold">Join the conversation</h3>
          {session?.user ? null : <GoogleSignInButton />}
        </div>
        {!session?.user && !googleSignInEnabled ? <p className="m-0 text-sm text-muted-foreground">Google sign-in is not configured yet.</p> : null}
        {session?.user ? <CommentForm postId={postId} siteKey={siteKey} /> : null}
      </div>
    </section>
  )
}
