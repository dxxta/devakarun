import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Wordmark({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block w-fit whitespace-nowrap font-display text-2xl font-extrabold leading-none tracking-tighter',
        className,
      )}
      {...props}
    >
      dev<span className="text-primary">.</span>akarun
    </span>
  )
}
