import { getPayload } from 'payload'

import { EmptyState } from '@/components/states/empty-state'
import { ErrorState } from '@/components/states/error-state'
import { Badge } from '@/components/ui/badge'
import { MediaImage } from '@/components/portfolio/media-image'
import { PaginatedGrid } from '@/components/portfolio/paginated-grid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import config from '@payload-config'
import type { Certificate } from '@/payload-types'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value))
}

export async function CertificatesSection() {
  let docs: Certificate[] = []
  let hasError = false

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'certificates',
      sort: 'order',
      limit: 50,
      depth: 1,
    })
    docs = [...result.docs].sort((left, right) => {
      const highlightOrder = Number(right.highlighted === true) - Number(left.highlighted === true)
      return highlightOrder || (left.order ?? 0) - (right.order ?? 0)
    })
  } catch {
    hasError = true
  }

  if (hasError) {
    return (
      <ErrorState title="Certificates could not load" message="Refresh the page to try again." />
    )
  }

  if (docs.length === 0) {
    return (
      <section aria-labelledby="certificates-heading" className="grid gap-5">
        <h2 className="m-0 scroll-mt-28 font-display text-2xl font-bold" id="certificates-heading">
          Certificates
        </h2>
        <EmptyState
          title="No certificates listed yet"
          hint="Add credentials in Payload to display them here."
        />
      </section>
    )
  }

  return (
    <section aria-labelledby="certificates-heading" className="grid gap-5">
      <h2 className="m-0 scroll-mt-28 font-display text-2xl font-bold" id="certificates-heading">
        Certificates
      </h2>
      <PaginatedGrid label="Certificates pages" pageSize={4}>
        {docs.map((certificate) => (
          <Card className="relative h-full w-full gap-4" data-pressable="card" key={certificate.id}>
            <MediaImage
              alt={certificate.title}
              className="aspect-[4/3] w-full rounded-control"
              imageClassName="object-contain"
              media={certificate.image}
              sizes="(min-width: 1152px) 560px, (min-width: 640px) 50vw, 85vw"
            />
            {certificate.highlighted === true ? (
              <Badge className="absolute top-8 left-8 z-10" variant="secondary">
                Highlight
              </Badge>
            ) : null}
            <CardHeader className="min-w-0 gap-2 p-0">
              <CardTitle className="line-clamp-2 min-h-[2.5em]">{certificate.title}</CardTitle>
              <p className="m-0 truncate text-muted-foreground">{certificate.issuer}</p>
            </CardHeader>
            <CardContent className="grid min-h-12 gap-1 p-0 text-sm text-muted-foreground">
              <p className="m-0">Issued {formatDate(certificate.issueDate)}</p>
              <p className="m-0">{certificate.expiryDate ? `Expires ${formatDate(certificate.expiryDate)}` : '\u00a0'}</p>
            </CardContent>
            {certificate.credentialUrl ? (
              <a
                className="mt-auto font-semibold underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                href={certificate.credentialUrl}
                rel="noreferrer"
                target="_blank"
              >
                View credential
              </a>
            ) : <span aria-hidden="true" className="mt-auto min-h-6" />}
          </Card>
        ))}
      </PaginatedGrid>
    </section>
  )
}
