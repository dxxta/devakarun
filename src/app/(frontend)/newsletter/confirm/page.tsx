import type { Metadata } from 'next'
import { confirmSubscription } from '../actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Confirm newsletter subscription' }

export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const result = token ? await confirmSubscription(token) : { success: false, message: 'This confirmation link is invalid or expired.' }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <section className="rounded-card border-2 border-border bg-card p-8 shadow-hard">
        <h1 className="text-3xl font-extrabold tracking-tight">{result.success ? 'You’re subscribed' : 'Confirmation link unavailable'}</h1>
        <p className="mt-4 text-muted-foreground">{result.message}</p>
      </section>
    </main>
  )
}
