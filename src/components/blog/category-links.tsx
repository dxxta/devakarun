import Link from 'next/link'
import type { Category } from '@/payload-types'
import { Badge } from '@/components/ui/badge'

export function CategoryLinks({ categories, selectedSlug }: { categories: Category[]; selectedSlug?: string }) {
  if (!categories.length) return null
  return (
    <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
      <Link aria-label="All blog posts" className="inline-flex rounded-pill" href="/blog"><Badge variant={selectedSlug ? 'outline' : 'default'}>All</Badge></Link>
      {categories.map((category) => (
        <Link className="inline-flex rounded-pill" href={`/blog/category/${category.slug}`} key={category.id}>
          <Badge variant={selectedSlug === category.slug ? 'default' : 'outline'}>{category.name}</Badge>
        </Link>
      ))}
    </nav>
  )
}
