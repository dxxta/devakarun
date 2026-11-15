import Link from 'next/link'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

import { Button, buttonVariants } from '@/components/ui/button'

type SearchParams = Record<string, string | string[] | undefined>

function pageHref(basePath: string, page: number, searchParams: SearchParams = {}) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page' || value === undefined) continue
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item))
    else query.set(key, value)
  }

  if (page > 1) query.set('page', String(page))
  const search = query.toString()
  return search ? `${basePath}?${search}` : basePath
}

function getPageItems(page: number, totalPages: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const visiblePages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((left, right) => left - right)
  const items: Array<number | 'ellipsis-start' | 'ellipsis-end'> = []

  visiblePages.forEach((visiblePage, index) => {
    if (index > 0 && visiblePage - (visiblePages[index - 1] ?? visiblePage) > 1) {
      items.push(index === 1 ? 'ellipsis-start' : 'ellipsis-end')
    }
    items.push(visiblePage)
  })

  return items
}

export function Pagination({
  basePath,
  label,
  page,
  totalPages,
  searchParams,
}: {
  basePath: string
  label: string
  page: number
  totalPages: number
  searchParams?: SearchParams
}) {
  if (totalPages <= 1) return null

  const previousPage = page - 1
  const nextPage = page + 1

  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Button asChild aria-label="Previous page" size="icon" variant="quiet">
          <Link href={pageHref(basePath, previousPage, searchParams)}>
            <IconChevronLeft aria-hidden="true" className="size-5" />
          </Link>
        </Button>
      ) : (
        <span aria-disabled="true" aria-label="Previous page" className={`${buttonVariants({ size: 'icon', variant: 'quiet' })} opacity-[0.55]`}>
          <IconChevronLeft aria-hidden="true" className="size-5" />
        </span>
      )}

      {getPageItems(page, totalPages).map((item) => item === 'ellipsis-start' || item === 'ellipsis-end' ? (
        <span aria-hidden="true" className="px-1 text-muted-foreground" key={item}>…</span>
      ) : (
        <Button asChild key={item} size="icon" variant={item === page ? 'default' : 'quiet'}>
          <Link aria-current={item === page ? 'page' : undefined} aria-label={`Page ${item}`} href={pageHref(basePath, item, searchParams)}>
            {item}
          </Link>
        </Button>
      ))}

      {page < totalPages ? (
        <Button asChild aria-label="Next page" size="icon" variant="quiet">
          <Link href={pageHref(basePath, nextPage, searchParams)}>
            <IconChevronRight aria-hidden="true" className="size-5" />
          </Link>
        </Button>
      ) : (
        <span aria-disabled="true" aria-label="Next page" className={`${buttonVariants({ size: 'icon', variant: 'quiet' })} opacity-[0.55]`}>
          <IconChevronRight aria-hidden="true" className="size-5" />
        </span>
      )}

    </nav>
  )
}
