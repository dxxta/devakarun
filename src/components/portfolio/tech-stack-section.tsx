import { getPayload } from 'payload'

import { EmptyState } from '@/components/states/empty-state'
import { ErrorState } from '@/components/states/error-state'
import { Badge } from '@/components/ui/badge'
import type { TechStack } from '@/payload-types'
import config from '@payload-config'

const categoryLabels: Record<TechStack['category'], string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  devops: 'DevOps',
  tools: 'Tools',
  other: 'Other',
}

export async function TechStackSection() {
  let docs: TechStack[] = []
  let hasError = false

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'tech-stack',
      sort: 'order',
      limit: 100,
      depth: 1,
    })
    docs = result.docs
  } catch {
    hasError = true
  }

  if (hasError) {
    return <ErrorState title="Technology could not load" message="Refresh the page to try again." />
  }

  if (docs.length === 0) {
    return (
      <section aria-labelledby="tech-stack-heading" className="grid gap-5">
        <h2 className="m-0 scroll-mt-28 font-display text-2xl font-bold" id="tech-stack-heading">Technology</h2>
        <EmptyState
          title="No technologies listed yet"
          hint="Add technologies in Payload to show the tools used on this site."
        />
      </section>
    )
  }

  const grouped = new Map<TechStack['category'], TechStack[]>()
  for (const item of docs) {
    const items = grouped.get(item.category) ?? []
    items.push(item)
    grouped.set(item.category, items)
  }

  return (
    <section aria-labelledby="tech-stack-heading" className="grid gap-5">
      <h2 className="m-0 scroll-mt-28 font-display text-2xl font-bold" id="tech-stack-heading">Technology</h2>
      <div className="grid gap-5">
        {[...grouped.entries()].map(([category, items]) => (
          <div className="grid gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0" key={category}>
            <h3 className="m-0 font-display text-lg font-semibold">{categoryLabels[category]}</h3>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {items.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <Badge variant={index % 2 === 0 ? 'default' : 'secondary'}>{item.name}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
