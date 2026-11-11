'use client'

import Script from 'next/script'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { addComment } from '@/components/comments/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

declare global {
  interface Window {
    turnstile?: { reset: () => void }
  }
}

export function CommentForm({ postId, siteKey }: { postId: number; siteKey: string }) {
  const [submitting, setSubmitting] = useState(false)

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const form = event.currentTarget
    const data = new FormData(form)
    setSubmitting(true)
    try {
      await addComment(postId, null, String(data.get('body') ?? ''), String(data.get('cf-turnstile-response') ?? '') || null)
      form.reset()
      window.turnstile?.reset()
      toast.success('Your comment is waiting for approval')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit your comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <form className="grid gap-4" onSubmit={submitComment}>
        <label className="grid gap-2 font-medium" htmlFor="comment-body">
          Your comment
          <Textarea id="comment-body" maxLength={2000} minLength={1} name="body" required rows={5} />
        </label>
        <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
        <Button disabled={submitting || !siteKey} type="submit">{submitting ? 'Sending…' : 'Send comment'}</Button>
        {!siteKey ? <p className="m-0 text-sm text-muted-foreground">Comment verification is not configured yet.</p> : null}
      </form>
    </>
  )
}
