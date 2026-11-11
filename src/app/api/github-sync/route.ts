import { timingSafeEqual } from 'node:crypto'
import { getPayload } from 'payload'
import { z } from 'zod'
import config from '@/payload.config'
import { env } from '@/lib/env'
import { syncProject } from '@/lib/github/sync'

const bodySchema = z.object({
  repo: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/).optional(),
}).strict()

function hasCronAuthorization(request: Request): boolean {
  const expected = env.CRON_SECRET
  const supplied = request.headers.get('x-cron-secret')
  if (!expected || !supplied) return false
  const expectedBytes = Buffer.from(expected)
  const suppliedBytes = Buffer.from(supplied)
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes)
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config: await config })
  let isAdmin = false
  try {
    const auth = await payload.auth({ headers: request.headers })
    isAdmin = Boolean(auth.user)
  } catch {
    isAdmin = false
  }
  if (!isAdmin && !hasCronAuthorization(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Provide an optional repository in owner/name format.' }, { status: 400 })

  const repositories = parsed.data.repo
    ? [parsed.data.repo]
    : (await payload.find({
      collection: 'projects',
      overrideAccess: true,
      limit: 1000,
      where: { source: { equals: 'github' } },
    })).docs.map((project) => project.githubRepo).filter((repo): repo is string => Boolean(repo))

  const synced: { repo: string; id: number | string }[] = []
  const failed: { repo: string; error: string }[] = []
  for (const repo of [...new Set(repositories)]) {
    try {
      const project = await syncProject(payload, repo)
      synced.push({ repo, id: project.id })
    } catch (error) {
      failed.push({ repo, error: error instanceof Error ? error.message : 'Sync failed.' })
    }
  }

  return Response.json({ synced: synced.length, failed: failed.length, projects: synced, errors: failed })
}
