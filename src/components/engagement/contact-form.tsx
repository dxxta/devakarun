'use client'

import Script from 'next/script'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitContactMessage } from '@/app/(frontend)/contact/actions'

type TurnstileWindow = Window & { turnstile?: { reset: () => void } }

export function ContactForm({ siteKey }: { siteKey?: string }) {
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const result = await submitContactMessage({
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      website: formData.get('website'),
      turnstileToken: formData.get('cf-turnstile-response'),
    })
    setPending(false)
    if (result.success) {
      toast.success(result.message)
      form.reset()
      ;(window as TurnstileWindow).turnstile?.reset()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <form onSubmit={onSubmit} className="grid gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid content-start gap-2 text-sm font-medium" htmlFor="contact-name">
            <span className="text-xs font-semibold text-muted-foreground">Name</span>
            <Input aria-describedby="contact-name-help" id="contact-name" name="name" autoComplete="name" required maxLength={120} />
            <span className="text-xs leading-relaxed text-muted-foreground" id="contact-name-help">How should I address you?</span>
          </label>
          <label className="grid content-start gap-2 text-sm font-medium" htmlFor="contact-email">
            <span className="text-xs font-semibold text-muted-foreground">Email</span>
            <Input aria-describedby="contact-email-help" id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} />
            <span className="text-xs leading-relaxed text-muted-foreground" id="contact-email-help">I’ll use this address to reply.</span>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium" htmlFor="contact-subject">
          <span className="text-xs font-semibold text-muted-foreground">Subject</span>
          <Input aria-describedby="contact-subject-help" id="contact-subject" name="subject" required maxLength={180} />
          <span className="text-xs leading-relaxed text-muted-foreground" id="contact-subject-help">Briefly describe what your message is about.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="contact-message">
          <span className="text-xs font-semibold text-muted-foreground">Message</span>
          <Textarea aria-describedby="contact-message-help" id="contact-message" name="message" rows={6} required maxLength={10000} />
          <span className="text-xs leading-relaxed text-muted-foreground" id="contact-message-help">Share any details that will help me respond.</span>
        </label>
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label htmlFor="contact-website">Leave this field empty</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        {siteKey ? <div className="cf-turnstile" data-sitekey={siteKey} /> : <p role="status">Security check is unavailable.</p>}
        <div className="mt-2 flex justify-start">
          <Button className="w-full sm:w-auto" type="submit" disabled={pending || !siteKey}>
            {pending ? 'Sending…' : 'Send message'}
          </Button>
        </div>
      </form>
    </>
  )
}
