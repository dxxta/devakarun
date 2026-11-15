import { getPayload } from 'payload'
import config from '@payload-config'

async function pruneAnalytics(): Promise<void> {
  const payload = await getPayload({ config })
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  try {
    for (const collection of ['page-visits', 'post-views', 'analytics-events'] as const) {
      const result = await payload.delete({
        collection,
        where: { createdAt: { less_than: cutoff } },
        overrideAccess: true,
      })
      payload.logger.info(`Pruned ${result.docs.length} ${collection} records.`)
    }
  } finally {
    await payload.destroy()
  }
}

await pruneAnalytics()
