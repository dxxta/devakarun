import type { Metadata } from 'next'
import { getPayload } from 'payload'
import { IconBrandGithub, IconBrandLinkedin, IconMail, IconWorld } from '@tabler/icons-react'
import { ContactForm } from '@/components/engagement/contact-form'
import { env } from '@/lib/env'
import config from '@payload-config'
import type { Profile } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Contact' }

function readableContactValue(url: string): string {
  if (url.toLowerCase().startsWith('mailto:')) return decodeURIComponent(url.slice('mailto:'.length))

  try {
    const parsed = new URL(url)
    const host = parsed.host.replace(/^www\./, '')
    return `${host}${parsed.pathname === '/' ? '' : parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

function ContactIcon({ label, url }: { label: string; url: string }) {
  const normalizedLabel = label.toLowerCase()
  const iconClassName = 'size-5 shrink-0'

  if (normalizedLabel === 'github') return <IconBrandGithub aria-hidden="true" className={iconClassName} />
  if (normalizedLabel === 'linkedin') return <IconBrandLinkedin aria-hidden="true" className={iconClassName} />
  if (normalizedLabel === 'email' || url.toLowerCase().startsWith('mailto:')) {
    return <IconMail aria-hidden="true" className={iconClassName} />
  }
  return <IconWorld aria-hidden="true" className={iconClassName} />
}

export default async function ContactPage() {
  let contactLinks: NonNullable<Profile['contactLinks']> = []

  try {
    const payload = await getPayload({ config })
    const profile = await payload.findGlobal({ slug: 'profile', overrideAccess: true })
    contactLinks = profile.contactLinks ?? []
  } catch {
    contactLinks = []
  }

  return (
    <div className="grid gap-8">
      <section className="grid grid-cols-1 items-stretch gap-2 overflow-hidden rounded-card border-2 border-border bg-card p-2 sm:p-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <aside className="rounded-card bg-primary p-8 text-primary-foreground lg:p-10">
          <div className="grid content-start gap-8">
            <div>
              <h1 className="mb-2 mt-0 font-display text-2xl font-bold tracking-tight">Contact information</h1>
              <p className="mb-2 mt-0 max-w-prose text-sm leading-relaxed text-primary-foreground/70">
                Send a message and I will reply by email.
              </p>
            </div>
            {contactLinks.length ? (
              <ul className="m-0 grid list-none gap-6 p-0">
                {contactLinks.map(({ id, label, url }) => (
                  <li key={id ?? `${label}-${url}`}>
                    <a
                      className="flex min-w-0 items-start gap-3 rounded-control p-2 text-primary-foreground underline decoration-primary-foreground/60 underline-offset-4 hover:bg-primary-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      data-pressable="card"
                      href={url}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ink text-primary-foreground">
                        <ContactIcon label={label} url={url} />
                      </span>
                      <span className="grid min-w-0 gap-1">
                        <span className="font-semibold">{label}</span>
                        <span className="break-all text-sm text-primary-foreground/70">{readableContactValue(url)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 p-6 sm:p-8 lg:p-10">
          <h2 className="mb-6 mt-0 font-display text-2xl font-bold tracking-tight sm:text-3xl">Send a message</h2>
          <ContactForm siteKey={env.TURNSTILE_SITE_KEY ?? (process.env.NODE_ENV === 'development' ? '1x00000000000000000000AA' : undefined)} />
        </div>
      </section>
    </div>
  )
}
