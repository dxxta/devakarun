'use client'

import { toast, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

export function SyncButton() {
  const repoValue = useFormFields(([fields]) => fields.githubRepo?.value)
  const githubRepo = typeof repoValue === 'string' ? repoValue.trim() : ''
  const [pending, setPending] = useState(false)

  async function sync() {
    if (!githubRepo || pending) return
    setPending(true)
    try {
      const response = await fetch('/api/github-sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ repo: githubRepo }),
      })
      const result = await response.json() as { synced?: number; failed?: number; error?: string }
      if (!response.ok) throw new Error(result.error ?? 'GitHub sync failed.')
      if (result.failed) toast.error(`Synced ${result.synced ?? 0}; ${result.failed} failed.`)
      else toast.success('Project synced from GitHub.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'GitHub sync failed.')
    } finally {
      setPending(false)
    }
  }

  if (!githubRepo) return null

  return (
    <div className="field-type ui">
      <button className="btn btn--style-primary" type="button" onClick={sync} disabled={pending}>
        {pending ? 'Syncing…' : 'Sync from GitHub'}
      </button>
    </div>
  )
}
