'use client'

import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from '@payloadcms/ui'

type ThemeMode = 'light' | 'dark' | 'auto'

export default function ThemeToggleAction() {
  const { autoMode, setTheme, theme } = useTheme()
  const currentMode: ThemeMode = autoMode ? 'auto' : theme
  const nextMode: ThemeMode = currentMode === 'light' ? 'dark' : currentMode === 'dark' ? 'auto' : 'light'
  const modeLabel = currentMode[0].toUpperCase() + currentMode.slice(1)
  const nextLabel = nextMode[0].toUpperCase() + nextMode.slice(1)
  const Icon = currentMode === 'light' ? IconSun : currentMode === 'dark' ? IconMoon : IconDeviceDesktop

  function cycleTheme() {
    ;(setTheme as (mode: ThemeMode) => void)(nextMode)
  }

  return (
    <button
      aria-label={`Theme: ${modeLabel}. Switch to ${nextLabel}`}
      className="btn btn--style-secondary btn--size-small"
      onClick={cycleTheme}
      style={{ width: 36, height: 36, minWidth: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--theme-elevation-150)', borderRadius: 'var(--style-radius-s)', color: 'var(--theme-text)' }}
      title={`Theme: ${modeLabel}. Switch to ${nextLabel}`}
      type="button"
    >
      <Icon aria-hidden="true" size={18} />
    </button>
  )
}
