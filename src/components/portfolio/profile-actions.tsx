'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { IconBrandGithub, IconDownload } from '@tabler/icons-react'

import { fireConfetti } from '@/components/confetti'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/payload-types'

export function ProfileActions({
  contactLinks,
  showAboutLink = true,
}: {
  contactLinks: Profile['contactLinks']
  showAboutLink?: boolean
}) {
  const primaryContact = contactLinks?.[0]
  const pathname = usePathname()
  const isAboutPage = pathname === '/about'
  const [dialogOpen, setDialogOpen] = useState(false)
  const aboutLinkRef = useRef<HTMLAnchorElement>(null)

  const aboutLink = (
    <Button asChild variant="quiet">
      <Link
        href="/about"
        onClick={(event) => {
          if (!isAboutPage) return
          event.preventDefault()
          const bounds = event.currentTarget.getBoundingClientRect()
          fireConfetti({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 })
          setDialogOpen(true)
        }}
        ref={aboutLinkRef}
      >
        About me
      </Link>
    </Button>
  )

  return (
    <div className="flex flex-wrap gap-3">
      {primaryContact ? (
        <Button asChild>
          <a href={primaryContact.url}>
            {primaryContact.label === 'GitHub' ? (
              <IconBrandGithub aria-hidden="true" className="size-4" />
            ) : null}
            {primaryContact.label}
          </a>
        </Button>
      ) : null}
      {showAboutLink ? aboutLink : null}
      {isAboutPage ? (
        <DialogPrimitive.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-ink/60" />
            <DialogPrimitive.Content
              className="fixed top-1/2 left-1/2 z-[120] grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-card border-2 border-border bg-card p-6 text-card-foreground shadow-hard focus:outline-none"
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                aboutLinkRef.current?.focus()
              }}
            >
              <DialogPrimitive.Title className="m-0 font-display text-2xl font-bold">You already here 😄</DialogPrimitive.Title>
              <DialogPrimitive.Description className="m-0 leading-relaxed text-muted-foreground">
                You’re already on the About page. Take a look around!
              </DialogPrimitive.Description>
              <div className="flex flex-wrap justify-end gap-3">
                <Button asChild variant="quiet">
                  <a href="/cv/Mochammad-Dinta-Alif-Syaifuddin-CV.pdf" download>
                    <IconDownload aria-hidden="true" className="size-4" />
                    CV (PDF)
                  </a>
                </Button>
                <Button asChild variant="quiet">
                  <a href="/cv/Mochammad-Dinta-Alif-Syaifuddin-CV-ATS.docx" download>
                    <IconDownload aria-hidden="true" className="size-4" />
                    ATS CV (DOCX)
                  </a>
                </Button>
                <DialogPrimitive.Close asChild>
                  <Button type="button">OK</Button>
                </DialogPrimitive.Close>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      ) : null}
    </div>
  )
}
