'use client'

import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'

const themes = ['light', 'dark', 'system'] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const currentTheme = mounted ? (theme ?? 'system') : 'system'
  const nextTheme = themes[(themes.indexOf(currentTheme as (typeof themes)[number]) + 1) % themes.length] ?? 'light'
  const Icon = currentTheme === 'light' ? IconSun : currentTheme === 'dark' ? IconMoon : IconDeviceDesktop

  return (
    <Button
      aria-label={`Theme: ${currentTheme}. Switch to ${nextTheme} theme.`}
      className="size-11 rounded-full"
      onClick={() => setTheme(nextTheme)}
      size="icon"
      type="button"
      variant="outline"
    >
      <Icon aria-hidden="true" className="size-5" />
    </Button>
  )
}
