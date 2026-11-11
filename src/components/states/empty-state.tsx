import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <Card className="border-2 border-border bg-card p-5 shadow-hard">
      <CardHeader className="gap-2 p-0">
        <CardTitle className="font-display text-xl font-bold">{title}</CardTitle>
        <p className="m-0 text-pretty text-muted-foreground">{hint}</p>
      </CardHeader>
      {action ? <CardContent className="p-0 pt-2">{action}</CardContent> : null}
    </Card>
  )
}
