import { getPayload } from 'payload'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState } from '@/components/states/error-state'
import { ProfileActions } from '@/components/portfolio/profile-actions'
import { ProfileIntro } from '@/components/portfolio/profile-intro'
import config from '@payload-config'
import type { Profile } from '@/payload-types'

export async function ProfileHero() {
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

  if (!profile.name && !profile.headline) {
    return (
      <EmptyState
        title="Profile not set up yet"
        hint="Add a name and headline in Payload to introduce this site."
      />
    )
  }

  return (
    <ProfileIntro
      profile={profile}
      actions={<ProfileActions contactLinks={profile.contactLinks} />}
    />
  )
}
