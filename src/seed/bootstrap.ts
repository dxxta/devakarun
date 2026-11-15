import type { Payload } from 'payload'
import { env } from '../lib/env'
import { syncProject } from '../lib/github/sync'
import { seedBlog } from './blog'
import { seedContent } from './content'

const GITHUB_SYNC_DELAY_MS = 250

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function syncSeededProjects(payload: Payload): Promise<void> {
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_GITHUB_SYNC?.toLowerCase() === 'true') return

  try {
    const { docs } = await payload.find({
      collection: 'projects',
      where: { source: { equals: 'github' } },
      limit: 100,
      overrideAccess: true,
    })

    const repositories = docs.map(({ githubRepo }) => githubRepo).filter((repo): repo is string => Boolean(repo))
    for (const [index, repository] of repositories.entries()) {
      try {
        await syncProject(payload, repository)
      } catch (error) {
        payload.logger.error({ err: error, repo: repository, msg: 'Could not sync a seeded GitHub project.' })
      }

      if (index < repositories.length - 1) await delay(GITHUB_SYNC_DELAY_MS)
    }
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Could not load seeded GitHub projects for startup sync.' })
  }
}

export async function seedContentIfEmpty(payload: Payload): Promise<boolean> {
  if (env.SEED_CONTENT?.toLowerCase() === 'false') return false

  // SEED_ALL=true forces every seed (portfolio, gallery, blog) on this boot, even if content exists.
  // Seeds are upserts, so portfolio content edited in /console is reset to the seed values.
  if (env.SEED_ALL?.toLowerCase() === 'true') {
    await seedContent(payload)
    await seedBlog(payload)
    await syncSeededProjects(payload)
    return true
  }

  const [technologies, profile] = await Promise.all([
    payload.find({ collection: 'tech-stack', limit: 1, overrideAccess: true }),
    payload.findGlobal({ slug: 'profile', overrideAccess: true }),
  ])
  if (technologies.docs.length > 0 || profile.name) return false

  // First boot seeds everything: portfolio, gallery images (inside seedContent) and the blog.
  await seedContent(payload)
  try {
    await seedBlog(payload)
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Could not seed the initial blog content.' })
  }
  await syncSeededProjects(payload)
  return true
}
