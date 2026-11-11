import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { ErrorState } from '@/components/states/error-state'
import { EmptyState } from '@/components/states/empty-state'
import { ProfileActions } from '@/components/portfolio/profile-actions'
import { ProfileIntro } from '@/components/portfolio/profile-intro'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import config from '@payload-config'
import { splitBio } from '@/lib/bio'
import type { Profile } from '@/payload-types'

export async function ProfileSection() {
  let profile: Profile | undefined
  let hasError = false

  try {
    const payload = await getPayload({ config })
    profile = await payload.findGlobal({ slug: 'profile', depth: 1 })
  } catch {
    hasError = true
  }

  if (hasError || !profile) {
    return <ErrorState title="Profile could not load" message="Refresh the page to try again." />
  }

  if (!profile.name && !profile.headline && !profile.bio) {
    return (
      <EmptyState
        title="Profile not set up yet"
        hint="Add profile details in Payload to introduce this About page."
      />
    )
  }

  const { sections } = splitBio(profile.bio)

  return (
    <div className="grid gap-10">
      <ProfileIntro
        compact
        profile={profile}
        actions={<ProfileActions contactLinks={profile.contactLinks} />}
      />

      {sections.length ? (
        <Accordion
          className="w-full rounded-card border-2 border-border bg-card px-5 sm:px-7"
          type="multiple"
        >
          {sections.map((section) => (
            <AccordionItem key={section.title} value={section.title}>
              <AccordionTrigger className="font-display text-lg font-bold sm:text-xl">
                {section.title}
              </AccordionTrigger>
              <AccordionContent forceMount className="data-[state=closed]:hidden">
                <div className="text-muted-foreground leading-relaxed [&_li+li]:mt-2 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6">
                  <RichText data={section.content} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : null}
    </div>
  )
}
