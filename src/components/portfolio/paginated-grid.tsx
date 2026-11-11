'use client'

import { Children, useState, type ReactNode } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

type PaginatedGridProps = {
  children: ReactNode
  pageSize: number
  label: string
  columns?: 2 | 3
}

export function PaginatedGrid({ children, pageSize, label, columns = 2 }: PaginatedGridProps) {
  const items = Children.toArray(children)
  const pageCount = Math.ceil(items.length / pageSize)
  const [currentPage, setCurrentPage] = useState(1)
  const regionLabel = label.replace(/\s+pages$/i, '')

  function showPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount))
  }

  return (
    <div className="grid min-w-0 gap-5">
      <div
        aria-label={`${regionLabel} carousel`}
        className="-mx-4 min-w-0 overflow-visible sm:mx-0"
        role="region"
      >
        <div
          className={`flex min-w-0 snap-x snap-mandatory items-stretch gap-5 overflow-x-auto px-4 pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:ring-[3px] focus-visible:ring-ring [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:auto-rows-fr sm:items-stretch sm:snap-none sm:overflow-visible sm:p-0 ${columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}
          role="list"
          tabIndex={0}
        >
          {items.map((item, index) => {
            const itemPage = Math.floor(index / pageSize) + 1
            const isHidden = itemPage !== currentPage

            return (
              <div
                className={`block min-w-0 w-[85%] shrink-0 basis-[85%] snap-center sm:w-full sm:basis-auto sm:snap-none [&>*]:h-full [&>*]:w-full ${isHidden ? 'max-sm:!block sm:hidden' : ''}`}
                hidden={isHidden}
                key={index}
                role="listitem"
              >
                {item}
              </div>
            )
          })}
        </div>
      </div>

      {pageCount > 1 ? (
        <nav aria-label={label} className="mt-6 hidden flex-wrap items-center justify-center gap-2 sm:flex">
          <Button
            aria-label="Previous page"
            className="!size-10 !min-w-10 !shrink-0 !rounded-full !border-2 !p-0"
            disabled={currentPage === 1}
            onClick={() => showPage(currentPage - 1)}
            size="icon"
            type="button"
            variant="quiet"
          >
            <IconChevronLeft aria-hidden="true" className="size-5" />
          </Button>
          {Array.from({ length: pageCount }, (_, index) => {
            const page = index + 1
            const isCurrentPage = page === currentPage

            return (
              <Button
                aria-current={isCurrentPage ? 'page' : undefined}
                aria-label={`Go to page ${page}`}
                className={`!size-10 !min-w-10 !shrink-0 !rounded-full !border-2 !p-0 font-display text-sm tabular-nums ${isCurrentPage ? '!border-ink' : ''}`}
                key={page}
                onClick={() => showPage(page)}
                size="icon"
                type="button"
                variant={isCurrentPage ? 'default' : 'quiet'}
              >
                {page}
              </Button>
            )
          })}
          <Button
            aria-label="Next page"
            className="!size-10 !min-w-10 !shrink-0 !rounded-full !border-2 !p-0"
            disabled={currentPage === pageCount}
            onClick={() => showPage(currentPage + 1)}
            size="icon"
            type="button"
            variant="quiet"
          >
            <IconChevronRight aria-hidden="true" className="size-5" />
          </Button>
          <span aria-live="polite" className="sr-only">
            Page {currentPage} of {pageCount}
          </span>
        </nav>
      ) : null}
    </div>
  )
}
