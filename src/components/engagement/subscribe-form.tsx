'use client'

import Script from 'next/script'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribe } from '@/app/(frontend)/newsletter/actions'

export function SubscribeForm({ siteKey }: { siteKey?: string }) {
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const result = await subscribe(
      String(formData.get('email') ?? ''),
      formData.get('cf-turnstile-response')?.toString() ?? null,
    )
    setPending(false)
    if (result.success) {
      toast.success(result.message)
      form.reset()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <label className="sr-only" htmlFor="newsletter-email">Email address</label>
        <Input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} />
        {siteKey ? <div className="cf-turnstile" data-sitekey={siteKey} /> : <p role="status">Security check is unavailable.</p>}
        <Button type="submit" disabled={pending || !siteKey}>{pending ? 'Joining…' : 'Subscribe'}</Button>
      </form>
    </>
  )
}
