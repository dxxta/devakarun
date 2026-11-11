import type { Metadata } from 'next'
import { unsubscribe } from '../actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Newsletter unsubscribe' }

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const result = token ? await unsubscribe(token) : { success: false, message: 'This unsubscribe link is invalid or expired.' }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <section className="rounded-card border-2 border-border bg-card p-8 shadow-hard">
        <h1 className="text-3xl font-extrabold tracking-tight">{result.success ? 'Unsubscribed' : 'Unsubscribe link unavailable'}</h1>
        <p className="mt-4 text-muted-foreground">{result.message}</p>
      </section>
    </main>
  )
}
