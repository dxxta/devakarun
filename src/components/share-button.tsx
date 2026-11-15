'use client'

import { useEffect, useMemo, useState } from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandX,
  IconDeviceMobileShare,
  IconLink,
  IconMail,
  IconShare3,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

type ShareKind = 'post' | 'project'
type ShareButtonProps = {
  url: string
  title: string
  text?: string
  kind: ShareKind
  className?: string
}

type ShareIntent = { name: string; event: string; href: string; icon: typeof IconShare3 }

function copyFallback(value: string): boolean {
  const input = document.createElement('input')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  input.style.pointerEvents = 'none'
  input.style.left = '-9999px'
  document.body.append(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  return copied
}

export function ShareButton({ url, title, text, kind, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [nativeAvailable, setNativeAvailable] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareText = text?.trim() || title
  const trackLabel = useMemo(() => {
    try {
      const slug = new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? ''
      return `${kind}:${slug}`
    } catch {
      return `${kind}:unknown`
    }
  }, [kind, url])

  useEffect(() => {
    setNativeAvailable(typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const intents = useMemo<ShareIntent[]>(() => {
    const query = (values: Record<string, string>) => new URLSearchParams(values).toString()
    const encodedTitleAndURL = `${title}\n${url}`
    return [
      { name: 'X', event: 'share_x', href: `https://twitter.com/intent/tweet?${query({ text: title, url })}`, icon: IconBrandX },
      { name: 'LinkedIn', event: 'share_linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?${query({ url })}`, icon: IconBrandLinkedin },
      { name: 'Facebook', event: 'share_facebook', href: `https://www.facebook.com/sharer/sharer.php?${query({ u: url })}`, icon: IconBrandFacebook },
      { name: 'WhatsApp', event: 'share_whatsapp', href: `https://wa.me/?${query({ text: encodedTitleAndURL })}`, icon: IconBrandWhatsapp },
      { name: 'Telegram', event: 'share_telegram', href: `https://t.me/share/url?${query({ url, text: title })}`, icon: IconBrandTelegram },
      { name: 'Email', event: 'share_email', href: `mailto:?${query({ subject: title, body: `${shareText}\n${url}` })}`, icon: IconMail },
    ]
  }, [shareText, title, url])

  const copyLink = async () => {
    let success = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        success = true
      }
    } catch {
      success = false
    }
    if (!success) success = copyFallback(url)
    if (!success) {
      toast.error('Could not copy the link')
      return
    }
    setCopied(true)
    toast.success('Link copied')
    setOpen(false)
  }

  const shareWithDevice = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({ title, text: shareText, url })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      toast.error('Could not open the share sheet')
    } finally {
      setOpen(false)
    }
  }

  const rowClass = 'flex h-10 w-full items-center gap-3 rounded-control px-3 text-left text-sm text-foreground underline decoration-2 underline-offset-4 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <PopoverPrimitive.Root onOpenChange={setOpen} open={open}>
        <PopoverPrimitive.Trigger asChild>
          <Button aria-expanded={open} className="w-full sm:w-auto" variant="quiet">
            <IconShare3 aria-hidden="true" className="size-4" />
            Share
          </Button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content align="start" aria-label="Share options" className="z-[120] w-64 rounded-card border-2 border-ink-fixed bg-card p-2 text-card-foreground shadow-hard" side="bottom" sideOffset={8}>
            <div className="grid gap-0.5" role="group">
              <button className={rowClass} data-track="share_copy" data-track-label={trackLabel} onClick={() => void copyLink()} type="button">
                <IconLink aria-hidden="true" className="size-4" />Copy link
              </button>
              {nativeAvailable ? <button className={rowClass} data-track="share_native" data-track-label={trackLabel} onClick={() => void shareWithDevice()} type="button"><IconDeviceMobileShare aria-hidden="true" className="size-4" />Share via device</button> : null}
              {intents.map(({ event, href, icon: Icon, name }) => <a className={rowClass} data-track={event} data-track-label={trackLabel} href={href} key={event} rel="noopener noreferrer" target="_blank"><Icon aria-hidden="true" className="size-4" />{name}</a>)}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      <span aria-live="polite" className="absolute top-full left-0 mt-1 whitespace-nowrap text-xs text-muted-foreground">{copied ? 'Link copied' : ''}</span>
    </div>
  )
}
