import { Suspense } from 'react'
import { LoadingState } from '@/components/states/loading-state'
import { ProjectsGrid } from '@/components/portfolio/projects-grid'
import { ProfileHero } from '@/components/portfolio/profile-hero'
import { PortfolioShowcaseSection } from '@/components/portfolio/portfolio-showcase-section'
import { getSiteFeatures } from '@/lib/site-features'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { showProfileDownload } = await getSiteFeatures()

  return (
    <div className="grid w-full min-w-0 gap-16">
      <Suspense fallback={<LoadingState label="Loading profile…" variant="text" />}>
        <ProfileHero showProfileDownload={showProfileDownload} />
      </Suspense>
      <Suspense fallback={<LoadingState label="Loading featured showcase…" variant="cards" />}>
        <PortfolioShowcaseSection featuredOnly />
      </Suspense>
      <Suspense fallback={<LoadingState label="Loading featured projects…" variant="cards" />}>
        <ProjectsGrid featuredOnly heading="Featured projects" />
      </Suspense>
    </div>
  )
}
