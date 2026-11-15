import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

const DEFAULT_MESSAGES = [
  { text: 'Have a project or an idea in mind? Let’s talk.', label: 'Contact me', href: '/contact', event: 'marquee_contact' },
  { text: 'Only essential cookies here, no ads or trackers.', label: 'Cookie details', href: '/cookies', event: 'marquee_cookies' },
]

export async function SiteMarquee() {
  let enabled = true
  let message = ''
  let linkLabel = ''
  let linkUrl = ''

  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const announcement = settings.announcement
    enabled = announcement?.enabled !== false
    message = announcement?.text?.trim() ?? ''
    linkLabel = announcement?.linkLabel?.trim() ?? ''
    linkUrl = announcement?.linkUrl?.trim() ?? ''
  } catch {
    // Fall back to the default message when settings cannot load.
  }

  if (!enabled) return null

  const useDefault = !message
  const messages = useDefault
    ? DEFAULT_MESSAGES
    : [{ text: message, label: linkLabel, href: linkUrl || (linkLabel ? '/contact' : ''), event: undefined }]

  const item = (key: number) => {
    const current = messages[key % messages.length]
    if (!current) return null
    const duplicate = key >= messages.length
    const external = /^https?:\/\//.test(current.href)
    return (
      <span aria-hidden={duplicate ? 'true' : undefined} className="flex shrink-0 items-center gap-3 px-6" key={key}>
      <span>{current.text}</span>
      {current.href && current.label ? (
        <Link
          className="underline decoration-2 underline-offset-4"
          data-track={current.event}
          href={current.href}
          rel={external ? 'noreferrer' : undefined}
          tabIndex={duplicate ? -1 : undefined}
          target={external ? '_blank' : undefined}
        >
          {current.label}
        </Link>
      ) : null}
      <span aria-hidden="true">✦</span>
      </span>
    )
  }

  return (
    <div
      aria-label="Site announcement"
      className="site-marquee sticky top-0 z-50 w-full overflow-hidden border-b-2 border-ink-fixed bg-primary text-primary-foreground"
      role="region"
    >
      <div className="site-marquee-track flex w-max py-2 font-display text-sm font-bold whitespace-nowrap">
        {Array.from({ length: messages.length * 6 }, (_, index) => item(index))}
      </div>
    </div>
  )
}
