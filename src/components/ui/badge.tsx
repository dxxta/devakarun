import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from 'cn'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-pill border-2 px-2.5 py-0.5 font-display text-xs font-bold whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-ink bg-primary text-primary-foreground',
        secondary: 'border-ink bg-secondary text-secondary-foreground',
        destructive: 'border-error/30 bg-error/10 text-error',
        outline: 'border-border bg-card text-foreground',
        ghost: 'border-transparent bg-muted text-foreground',
        link: 'border-transparent bg-transparent text-foreground underline underline-offset-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
