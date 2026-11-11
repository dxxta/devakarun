"use client"

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      className="toaster group font-sans"
      icons={{
        success: <IconCircleCheck className="size-4" aria-hidden="true" />,
        info: <IconInfoCircle className="size-4" aria-hidden="true" />,
        warning: <IconAlertTriangle className="size-4" aria-hidden="true" />,
        error: <IconAlertTriangle className="size-4" aria-hidden="true" />,
        loading: <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />,
        close: <IconX className="size-4" aria-hidden="true" />,
      }}
      toastOptions={{
        classNames: {
          toast: 'rounded-control border-2 border-border bg-popover text-popover-foreground shadow-hard',
          title: 'font-display font-semibold',
          description: 'text-muted-foreground',
          error: '!border-error/30 !bg-error/10 !text-error',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius-control)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
