import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

type LoadingVariant = 'list' | 'cards' | 'detail' | 'text'

type LoadingStateProps = {
  label?: string
  variant?: LoadingVariant
}

function ListSkeleton() {
  return (
    <div className="w-full space-y-5">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="space-y-3" key={index}>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  )
}

function CardsSkeleton() {
  return (
    <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="flex flex-col gap-4 rounded-card border-2 border-border bg-card p-5 shadow-hard" key={index}>
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-4/5 sm:h-12" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className={index === 5 ? 'h-4 w-2/3' : 'h-4 w-full'} key={index} />
        ))}
      </div>
      <Skeleton className="aspect-video w-full" />
    </div>
  )
}

function TextSkeleton() {
  return (
    <div className="w-full space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export function LoadingState({ label = 'Loading content…', variant = 'list' }: LoadingStateProps) {
  let skeleton: ReactNode

  switch (variant) {
    case 'cards':
      skeleton = <CardsSkeleton />
      break
    case 'detail':
      skeleton = <DetailSkeleton />
      break
    case 'text':
      skeleton = <TextSkeleton />
      break
    case 'list':
      skeleton = <ListSkeleton />
      break
  }

  return (
    <div aria-live="polite" className="w-full py-6" role="status">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{skeleton}</div>
    </div>
  )
}
