import type { ReactNode } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { MediaImage } from '@/components/portfolio/media-image'
import type { Profile } from '@/payload-types'
import { splitBio } from '@/lib/bio'
import { cn } from '@/lib/utils'

type ProfileIntroProps = {
  profile: Profile
  actions?: ReactNode
  compact?: boolean
}

export function ProfileIntro({
  profile,
  actions,
  compact = false,
}: ProfileIntroProps) {
  const { intro } = splitBio(profile.bio)
  const hasAvatar = typeof profile.avatar === 'object' && profile.avatar !== null && typeof profile.avatar.url === 'string'

  return (
    <section
      className={cn(
        'grid min-w-0 items-center gap-8',
        compact
          ? 'md:grid-cols-[minmax(0,1fr)_10rem] md:gap-8'
          : 'md:grid-cols-[minmax(0,1fr)_16rem] md:gap-12',
      )}
    >
      <div className="grid min-w-0 justify-items-start gap-5">
        <div className="grid min-w-0 gap-3">
          <h1
            className={cn(
              'm-0 break-words text-balance font-display font-extrabold tracking-tight',
              compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-6xl',
            )}
          >
            {profile.name}
          </h1>
          {profile.headline ? (
            <p
              className={cn(
                'm-0 text-pretty font-semibold text-foreground',
                compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl',
              )}
            >
              {profile.headline}
            </p>
          ) : null}
        </div>
        {intro && intro.root.children.length > 0 ? (
          <div className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            <RichText data={intro} />
          </div>
        ) : null}
        {actions}
      </div>
      {hasAvatar ? (
        <div
          className={cn(
            'relative hidden aspect-square w-full max-w-64 justify-self-center overflow-hidden rounded-card bg-muted shadow-hard md:block',
            compact && 'max-w-40 md:max-w-full',
          )}
          data-pressable="card"
        >
          <MediaImage
            alt={profile.name}
            className="h-full w-full rounded-card border-0"
            media={profile.avatar}
            priority={!compact}
            sizes={compact ? '(min-width: 640px) 10rem, 70vw' : '(min-width: 768px) 16rem, 70vw'}
          />
        </div>
      ) : null}
    </section>
  )
}
