import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

const DEFAULT_MESSAGE = 'Have a project or an idea in mind? Let’s talk.'
const DEFAULT_LINK_LABEL = 'Contact me'
const DEFAULT_LINK_URL = '/contact'

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
  const text = useDefault ? DEFAULT_MESSAGE : message
  const label = useDefault ? DEFAULT_LINK_LABEL : linkLabel
  const href = useDefault ? DEFAULT_LINK_URL : linkUrl || (linkLabel ? DEFAULT_LINK_URL : '')
  const external = /^https?:\/\//.test(href)

  const item = (key: number) => (
    <span aria-hidden={key > 0 ? 'true' : undefined} className="flex shrink-0 items-center gap-3 px-6" key={key}>
      <span>{text}</span>
      {href && label ? (
        <Link
          className="underline decoration-2 underline-offset-4"
          href={href}
          rel={external ? 'noreferrer' : undefined}
          tabIndex={key > 0 ? -1 : undefined}
          target={external ? '_blank' : undefined}
        >
          {label}
        </Link>
      ) : null}
      <span aria-hidden="true">✦</span>
    </span>
  )

  return (
    <div
      aria-label="Site announcement"
      className="site-marquee sticky top-0 z-50 w-full overflow-hidden border-b-2 border-ink-fixed bg-primary text-primary-foreground"
      role="region"
    >
      <div className="site-marquee-track flex w-max py-2 font-display text-sm font-bold whitespace-nowrap">
        {Array.from({ length: 12 }, (_, index) => item(index))}
      </div>
    </div>
  )
}
