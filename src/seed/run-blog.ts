import { getPayload } from 'payload'
import config from '@payload-config'
import { seedBlog } from './blog'

async function runBlogSeed(): Promise<void> {
  const payload = await getPayload({ config })
  try {
    await seedBlog(payload)
    payload.logger.info('Blog content seeded.')
  } finally {
    await payload.destroy()
  }
}

await runBlogSeed()
