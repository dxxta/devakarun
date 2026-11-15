'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const options = [
  { type: 'like', label: 'Like', emoji: '👍' },
  { type: 'love', label: 'Love', emoji: '❤️' },
  { type: 'fire', label: 'Fire', emoji: '🔥' },
  { type: 'idea', label: 'Idea', emoji: '💡' },
  { type: 'clap', label: 'Clap', emoji: '👏' },
] as const

type ReactionType = (typeof options)[number]['type']
type ReactionState = { counts: Record<ReactionType, number>; mine: ReactionType[] }

const emptyState: ReactionState = {
  counts: { like: 0, love: 0, fire: 0, idea: 0, clap: 0 },
  mine: [],
}

export function Reactions({ slug }: { slug: string }) {
  const [state, setState] = useState<ReactionState>(emptyState)
  const [loaded, setLoaded] = useState(false)
  const [pending, setPending] = useState<ReactionType | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    fetch(`/api/posts/${encodeURIComponent(slug)}/reactions`, { cache: 'no-store', credentials: 'same-origin' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load reactions.')
        return response.json() as Promise<ReactionState>
      })
      .then((result) => {
        if (active) setState(result)
      })
      .catch(() => {
        if (active) setMessage('Reactions could not load right now.')
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => { active = false }
  }, [slug])

  async function toggle(type: ReactionType) {
    if (pending) return
    setPending(type)
    setMessage('')
    const previous = state
    const active = previous.mine.includes(type)
    setState({
      counts: { ...previous.counts, [type]: Math.max(0, previous.counts[type] + (active ? -1 : 1)) },
      mine: active ? previous.mine.filter((item) => item !== type) : [...previous.mine, type],
    })
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/reactions`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const result = await response.json() as ReactionState | { error?: string }
      if (!response.ok || !('counts' in result)) throw new Error('error' in result ? result.error : 'Could not save reaction.')
      setState(result)
    } catch (error) {
      setState(previous)
      setMessage(error instanceof Error ? error.message : 'Your reaction could not be saved.')
    } finally {
      setPending(null)
    }
  }

  return (
    <section aria-label="Post reactions" className="pb-8">
      <h2 className="mb-3 font-display text-base font-bold">Reactions</h2>
      <div className="flex flex-wrap gap-2">
        {options.map(({ type, label, emoji }) => (
          <Button
            aria-label={`${label}, ${state.counts[type]} reactions`}
            aria-pressed={state.mine.includes(type)}
            className={state.mine.includes(type) ? 'border-ink-fixed bg-primary text-primary-foreground' : undefined}
            disabled={!loaded || pending !== null}
            key={type}
            onClick={() => void toggle(type)}
            size="sm"
            variant="quiet"
          >
            <span aria-hidden="true">{emoji}</span>
            <span>{state.counts[type]}</span>
          </Button>
        ))}
      </div>
      <p aria-live="polite" className="m-0 mt-2 min-h-5 text-sm text-muted-foreground">{message}</p>
    </section>
  )
}
