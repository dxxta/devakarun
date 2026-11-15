'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export function CopyCodeButton({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button aria-label={copied ? 'Code copied' : 'Copy code'} data-track="code_copy" data-track-label={language} onClick={() => void copy()} size="xs" variant="quiet">
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </Button>
  )
}
