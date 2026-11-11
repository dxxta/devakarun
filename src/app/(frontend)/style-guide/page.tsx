import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/states/empty-state'
import { ErrorState } from '@/components/states/error-state'
import { LoadingState } from '@/components/states/loading-state'

export default function StyleGuidePage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <h1 className="m-0 text-balance font-display text-4xl font-extrabold sm:text-5xl">Style guide</h1>
        <p className="m-0 max-w-prose text-pretty text-muted-foreground">Preview the shared controls and content states.</p>
      </header>

      <section aria-labelledby="controls-title" className="space-y-5">
        <h2 className="m-0 font-display text-2xl font-bold" id="controls-title">Controls</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary action</Button>
          <Button variant="outline">Quiet action</Button>
          <Badge>Featured</Badge>
          <Badge variant="secondary">About</Badge>
        </div>
        <label className="grid max-w-sm gap-2 font-medium" htmlFor="sample-input">
          Email address
          <Input autoComplete="email" id="sample-input" placeholder="you@example.com" type="email" />
        </label>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Preview tabs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent className="pt-3 text-muted-foreground" value="overview">A short overview.</TabsContent>
          <TabsContent className="pt-3 text-muted-foreground" value="details">More detail goes here.</TabsContent>
        </Tabs>
      </section>

      <section aria-labelledby="card-title" className="space-y-5">
        <h2 className="m-0 font-display text-2xl font-bold" id="card-title">Card</h2>
        <Card className="border-2 border-border bg-card shadow-hard">
          <CardHeader><CardTitle className="font-display text-xl">A simple card</CardTitle></CardHeader>
          <CardContent><p className="m-0 text-pretty text-muted-foreground">A surface for a focused piece of information.</p></CardContent>
        </Card>
      </section>

      <section aria-labelledby="states-title" className="space-y-5">
        <h2 className="m-0 font-display text-2xl font-bold" id="states-title">Content states</h2>
        <div className="grid gap-8">
          <div className="space-y-3">
            <h3 className="m-0 font-display text-xl font-bold">List</h3>
            <LoadingState label="Loading a list…" variant="list" />
          </div>
          <div className="space-y-3">
            <h3 className="m-0 font-display text-xl font-bold">Cards</h3>
            <LoadingState label="Loading cards…" variant="cards" />
          </div>
          <div className="space-y-3">
            <h3 className="m-0 font-display text-xl font-bold">Detail</h3>
            <LoadingState label="Loading a detail page…" variant="detail" />
          </div>
        </div>
        <EmptyState action={<Button>Read about dev.akarun</Button>} hint="There are no posts here yet." title="No posts yet" />
        <ErrorState message="Refresh the page and try again." title="Could not load this section" />
      </section>
    </div>
  )
}
