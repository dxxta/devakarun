import { getPayload } from 'payload'
import config from '@payload-config'
import { seedGalleryImages } from './content.js'

async function runGallerySeed(): Promise<void> {
  const payload = await getPayload({ config })
  try {
    await seedGalleryImages(payload)
    payload.logger.info('Gallery images seeded.')
  } finally {
    await payload.destroy()
  }
}

await runGallerySeed()
