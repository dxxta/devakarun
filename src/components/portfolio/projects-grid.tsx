import { getPayload } from 'payload'
import Link from 'next/link'

import { EmptyState } from '@/components/states/empty-state'
import { ErrorState } from '@/components/states/error-state'
import { ProjectCard } from '@/components/portfolio/project-card'
import { PaginatedGrid } from '@/components/portfolio/paginated-grid'
import { Button } from '@/components/ui/button'
import config from '@payload-config'
import type { Project } from '@/payload-types'

type ProjectsGridProps = {
  featuredOnly?: boolean
  heading?: string
}

export async function ProjectsGrid({
  featuredOnly = false,
  heading = 'Projects',
}: ProjectsGridProps) {
  let docs: Project[] = []
  let hasMoreFeatured = false
  let hasError = false

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: featuredOnly ? { featured: { equals: true } } : undefined,
      sort: 'order',
      limit: featuredOnly ? 3 : 50,
      depth: 1,
    })
    hasMoreFeatured = featuredOnly && result.totalDocs > 3
    docs = [...result.docs].sort((left, right) => {
      const featuredOrder = Number(right.featured === true) - Number(left.featured === true)
      return featuredOrder || (left.order ?? 0) - (right.order ?? 0)
    })
  } catch {
    hasError = true
  }

  if (hasError) {
    return <ErrorState title="Projects could not load" message="Refresh the page to try again." />
  }

  if (docs.length === 0) {
    return (
      <section aria-labelledby="projects-heading" className="grid gap-5">
        <h2 className="m-0 scroll-mt-28 font-display text-2xl font-bold" id="projects-heading">
          {heading}
        </h2>
        <EmptyState
          title={featuredOnly ? 'No featured projects yet' : 'No projects yet'}
          hint="Projects added in Payload will appear here."
        />
      </section>
    )
  }

  return (
    <section aria-labelledby="projects-heading" className="grid gap-5">
      <h2 className="m-0 scroll-mt-28 font-display text-2xl font-bold" id="projects-heading">
        {heading}
      </h2>
      <PaginatedGrid label="Projects pages" pageSize={4} columns={featuredOnly ? 3 : 2}>
        {docs.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </PaginatedGrid>
      {hasMoreFeatured ? (
        <div className="flex justify-start">
          <Button asChild variant="quiet">
            <Link href="/about#projects-heading">View all projects</Link>
          </Button>
        </div>
      ) : null}
    </section>
  )
}
