import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from 'cn'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-display text-sm font-bold whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none aria-invalid:border-error aria-invalid:ring-error/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default:
          'border-[3px] border-ink bg-primary text-primary-foreground',
        quiet:
          'border-2 border-border bg-card text-foreground hover:bg-muted',
        destructive:
          'border-[3px] border-ink bg-destructive text-destructive-foreground',
        outline:
          'border-2 border-border bg-card text-foreground hover:bg-muted',
        secondary:
          'border-[3px] border-ink bg-secondary text-secondary-foreground',
        ghost:
          'border-2 border-transparent bg-transparent text-foreground hover:bg-muted',
        link: 'border-0 bg-transparent text-foreground underline decoration-2 underline-offset-4 hover:text-foreground/80',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: 'h-8 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*="size-"])]:size-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9 p-0',
        'icon-xs': 'size-8 p-0 [&_svg:not([class*="size-"])]:size-3',
        'icon-sm': 'size-8 p-0',
        'icon-lg': 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-pressable={size === 'icon' || size === 'icon-xs' || size === 'icon-sm' || size === 'icon-lg' ? 'icon' : 'button'}
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
