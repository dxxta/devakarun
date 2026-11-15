import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

export type SiteFeatures = {
  showProfileDownload: boolean
  showGallery: boolean
}

const defaultFeatures: SiteFeatures = {
  showProfileDownload: true,
  showGallery: true,
}

export const getSiteFeatures = cache(async (): Promise<SiteFeatures> => {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    return {
      showProfileDownload: settings.features?.showProfileDownload !== false,
      showGallery: settings.features?.showGallery !== false,
    }
  } catch {
    return defaultFeatures
  }
})
