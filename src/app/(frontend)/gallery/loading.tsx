import { Skeleton } from '@/components/ui/skeleton'

export default function GalleryLoading() {
  return (
    <div aria-live="polite" className="space-y-8 py-6" role="status">
      <span className="sr-only">Loading gallery…</span>
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton className="aspect-[4/3] w-full rounded-card" key={index} />
        ))}
      </div>
    </div>
  )
}
