import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { ErrorState } from '@/components/states/error-state'
import { ProjectDetail } from '@/components/portfolio/project-detail'
import type { Project } from '@/payload-types'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let project: Project | undefined
  let hasError = false

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    })
    project = docs[0]
  } catch {
    hasError = true
  }

  if (hasError) {
    return <ErrorState title="Project could not load" message="Refresh the page to try again." />
  }

  if (!project) {
    notFound()
  }

  return <ProjectDetail project={project} />
}
