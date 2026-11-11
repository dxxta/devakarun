import { Suspense } from 'react'
import type { Metadata } from 'next'

import { CertificatesSection } from '@/components/portfolio/certificates-section'
import { ProfileSection } from '@/components/portfolio/profile-section'
import { PortfolioShowcaseSection } from '@/components/portfolio/portfolio-showcase-section'
import { ProjectsGrid } from '@/components/portfolio/projects-grid'
import { TechStackSection } from '@/components/portfolio/tech-stack-section'
import { LoadingState } from '@/components/states/loading-state'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="grid gap-14">
      <Suspense fallback={<LoadingState label="Loading profile…" variant="text" />}>
        <ProfileSection />
      </Suspense>
      <Suspense fallback={<LoadingState label="Loading certificates…" variant="list" />}>
        <CertificatesSection />
      </Suspense>
      <Suspense fallback={<LoadingState label="Loading portfolio showcase…" variant="cards" />}>
        <PortfolioShowcaseSection />
      </Suspense>
      <Suspense fallback={<LoadingState label="Loading projects…" variant="cards" />}>
        <ProjectsGrid />
      </Suspense>
      <Suspense fallback={<LoadingState label="Loading technology…" variant="list" />}>
        <TechStackSection />
      </Suspense>
    </div>
  )
}
