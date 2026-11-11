'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { IconSearch, IconX } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState } from '@/components/states/error-state'

type SearchResult = { type: 'Post' | 'Project'; title: string; href: string; excerpt: string }

export function SearchDrawer() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim()
  const resultGroups = normalizedQuery.length < 2
    ? [
        { label: 'Posts', items: results.filter((result) => result.type === 'Post') },
        { label: 'Projects', items: results.filter((result) => result.type === 'Project') },
      ]
    : [{ label: null, items: results }]

  const runSearch = useCallback(async (term: string, signal?: AbortSignal) => {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch(`/api/site-search?q=${encodeURIComponent(term)}`, { signal })
      if (!response.ok) throw new Error('Search request failed')
      const data = (await response.json()) as { results?: SearchResult[] }
      setResults(data.results ?? [])
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return
      setError(true)
      setResults([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    const term = query.trim()
    if (!open) return
    const controller = new AbortController()
    const timeout = window.setTimeout(
      () => void runSearch(term, controller.signal),
      term.length >= 2 ? 250 : 0,
    )
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [open, query, runSearch])

  const clearQuery = () => {
    setQuery('')
    setResults([])
    setError(false)
    setLoading(open)
    inputRef.current?.focus()
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setError(false)
    if (open) setLoading(true)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setResults([])
      setError(false)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = query.trim()
    if (term.length >= 2) void runSearch(term)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button aria-label="Open search" className="size-11 rounded-full" size="icon" type="button" variant="outline">
          <IconSearch aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        aria-describedby={undefined}
        className="!h-[80dvh] !max-h-[80dvh] !w-full !max-w-none !overflow-hidden !rounded-t-card !border-2 !border-t-2 !border-b-0 !border-border !bg-card !p-0"
        side="bottom"
        showCloseButton={false}
      >
        <div className="relative mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-3 px-4 py-4 pb-[env(safe-area-inset-bottom)] sm:gap-4 sm:px-4 sm:py-6">
          <div className="flex shrink-0 items-center justify-between">
            <SheetHeader className="p-0">
              <SheetTitle className="font-display text-lg font-bold sm:text-xl">Search</SheetTitle>
            </SheetHeader>
            <Button aria-label="Close search" className="size-10" onClick={() => setOpen(false)} size="icon" type="button" variant="quiet">
              <IconX aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <form className="relative shrink-0" onSubmit={submit} role="search">
            <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <label className="sr-only" htmlFor="site-search-query">Search posts and projects</label>
            <Input
              autoComplete="off"
              className="h-12 pl-12 pr-12 text-base md:text-base [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              id="site-search-query"
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search posts and projects"
              ref={inputRef}
              type="search"
              value={query}
            />
            {query ? (
              <Button aria-label="Clear search" className="absolute top-1/2 right-2 size-8 min-h-0 min-w-0 -translate-y-1/2 rounded-md p-0 shadow-none" data-pressable="control" onClick={clearQuery} size="icon-sm" type="button" variant="ghost">
                <IconX aria-hidden="true" className="size-4" />
              </Button>
            ) : null}
          </form>
          <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            {loading ? (
              <div aria-label="Loading search results" className="grid gap-2 py-1" role="status">
                {[0, 1, 2].map((row) => <div className="h-16 animate-pulse rounded-card border-2 border-border bg-muted" key={row} />)}
              </div>
            ) : null}
            {!loading && error ? <ErrorState message="Please try your search again." title="Search is unavailable" /> : null}
            {!loading && !error && results.length === 0 ? (
              <EmptyState
                hint={normalizedQuery.length >= 2 ? 'Try another word or phrase.' : 'Published posts and projects will appear here.'}
                title={normalizedQuery.length >= 2 ? 'No matching results' : 'No searchable content yet'}
              />
            ) : null}
            {!loading && !error && results.length > 0 ? (
              <div className="grid gap-5">
                {resultGroups.map((group) => group.items.length > 0 ? (
                  <section aria-label={group.label ?? 'Search results'} className="grid gap-2" key={group.label ?? 'matched-results'}>
                    {group.label ? <h3 className="m-0 font-display text-base font-bold">{group.label}</h3> : null}
                    <ul aria-label={group.label ? undefined : 'Search results'} className="m-0 grid list-none gap-2 p-0">
                      {group.items.map((result) => (
                        <li key={`${result.type}:${result.href}`}>
                          <SheetClose asChild>
                            <Link className="flex min-h-16 items-start gap-3 rounded-card border-2 border-border bg-card p-3 text-foreground shadow-hard transition hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" data-pressable="card" href={result.href}>
                              <Badge className="mt-0.5" variant="secondary">{result.type}</Badge>
                              <span className="min-w-0">
                                <span className="block font-display font-bold">{result.title}</span>
                                {result.excerpt ? <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">{result.excerpt}</span> : null}
                              </span>
                            </Link>
                          </SheetClose>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null)}
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
