import type { ReactNode } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { MediaImage } from '@/components/portfolio/media-image'
import { GlitchAvatar } from '@/components/portfolio/glitch-avatar'
import type { Profile } from '@/payload-types'
import { splitBio } from '@/lib/bio'
import { cn } from '@/lib/utils'

type ProfileIntroProps = {
  profile: Profile
  actions?: ReactNode
  compact?: boolean
  interactiveAvatar?: boolean
}

export function ProfileIntro({
  profile,
  actions,
  compact = false,
  interactiveAvatar = false,
}: ProfileIntroProps) {
  const { intro } = splitBio(profile.bio)
  const primaryAvatar = typeof profile.avatar === 'object' && profile.avatar !== null ? profile.avatar : null
  const secondaryAvatar = typeof profile.avatarAlt === 'object' && profile.avatarAlt !== null ? profile.avatarAlt : null
  const hasAvatar = typeof primaryAvatar?.url === 'string'
  const hasHoverAvatar = typeof secondaryAvatar?.url === 'string'
  const avatarCardClass = compact
    ? 'relative h-24 w-24 min-h-20 min-w-20 shrink-0 aspect-square overflow-hidden rounded-card border-2 border-ink-fixed bg-muted shadow-[3px_3px_0_#000] md:h-40 md:w-40 md:border-border md:shadow-hard'
    : 'relative h-24 w-24 min-h-20 min-w-20 shrink-0 aspect-square overflow-hidden rounded-card border-2 border-ink-fixed bg-muted shadow-[3px_3px_0_#000] md:h-64 md:w-64 md:border-border md:shadow-hard'
  const avatarSizes = compact ? '(min-width: 768px) 10rem, 6rem' : '(min-width: 768px) 16rem, 6rem'

  return (
    <section className={cn('profile-intro-grid', compact && 'profile-intro-grid--compact')}>
      <div className="profile-intro-grid__title min-w-0" style={{ gridArea: 'title' }}>
        <div className="grid min-w-0 justify-items-start gap-3">
          <h1
            className={cn(
              'm-0 break-words text-balance font-display font-extrabold tracking-tight',
              compact ? 'text-3xl sm:text-4xl' : 'text-3xl sm:text-6xl',
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
      </div>

      {hasAvatar && primaryAvatar ? (
        <div className="profile-intro-grid__avatar" style={{ gridArea: 'avatar' }}>
          {interactiveAvatar && hasHoverAvatar && secondaryAvatar ? (
            <GlitchAvatar
              className={avatarCardClass}
              cloudflare={process.env.CLOUDFLARE_IMAGES === 'true'}
              name={profile.name}
              priority={!compact}
              primary={primaryAvatar}
              secondary={secondaryAvatar}
              sizes={avatarSizes}
            />
          ) : (
            <div className={avatarCardClass}>
              <MediaImage
                alt={profile.name}
                className="h-full w-full rounded-card border-0"
                media={profile.avatar}
                priority={!compact}
                sizes={avatarSizes}
              />
            </div>
          )}
        </div>
      ) : null}

      {intro && intro.root.children.length > 0 ? (
        <div className="profile-intro-grid__bio min-w-0 max-w-2xl text-pretty leading-relaxed text-muted-foreground" style={{ gridArea: 'bio' }}>
          <RichText data={intro} />
        </div>
      ) : null}
      {actions ? (
        <div className="profile-intro-grid__actions min-w-0" style={{ gridArea: 'actions' }}>
          {actions}
        </div>
      ) : null}
    </section>
  )
}
